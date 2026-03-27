package middleware

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"strings"

	"github.com/dhavisiregar/expense-manager/pkg/response"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type contextKey string

const UserIDKey contextKey = "user_id"

func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			response.Error(w, http.StatusUnauthorized, "missing authorization header")
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
			response.Error(w, http.StatusUnauthorized, "invalid authorization header format")
			return
		}

		tokenStr := parts[1]

		// Peek at the header to determine signing algorithm
		alg, kid, err := peekTokenHeader(tokenStr)
		if err != nil {
			response.Error(w, http.StatusUnauthorized, "malformed token")
			return
		}

		var token *jwt.Token

		switch alg {
		case "HS256":
			secret := os.Getenv("SUPABASE_JWT_SECRET")
			if secret == "" {
				response.Error(w, http.StatusInternalServerError, "missing SUPABASE_JWT_SECRET")
				return
			}
			token, err = jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
				}
				return []byte(secret), nil
			})

		case "ES256":
			jwksURL := os.Getenv("SUPABASE_JWKS_URL")
			if jwksURL == "" {
				// Build default JWKS URL from Supabase project URL
				projectURL := os.Getenv("NEXT_PUBLIC_SUPABASE_URL")
				if projectURL == "" {
					supabaseURL := os.Getenv("SUPABASE_URL")
					if supabaseURL != "" {
						projectURL = supabaseURL
					}
				}
				if projectURL != "" {
					jwksURL = projectURL + "/auth/v1/.well-known/jwks.json"
				}
			}
			if jwksURL == "" {
				response.Error(w, http.StatusInternalServerError, "missing SUPABASE_URL for ES256 verification")
				return
			}
			pubKey, keyErr := fetchECPublicKey(jwksURL, kid)
			if keyErr != nil {
				response.Error(w, http.StatusUnauthorized, "could not fetch signing key")
				return
			}
			token, err = jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodECDSA); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
				}
				return pubKey, nil
			})

		default:
			response.Error(w, http.StatusUnauthorized, fmt.Sprintf("unsupported algorithm: %s", alg))
			return
		}

		if err != nil || !token.Valid {
			response.Error(w, http.StatusUnauthorized, "invalid or expired token")
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			response.Error(w, http.StatusUnauthorized, "invalid token claims")
			return
		}

		sub, ok := claims["sub"].(string)
		if !ok || sub == "" {
			response.Error(w, http.StatusUnauthorized, "missing user id in token")
			return
		}

		userID, err := uuid.Parse(sub)
		if err != nil {
			response.Error(w, http.StatusUnauthorized, "invalid user id in token")
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func GetUserID(ctx context.Context) (uuid.UUID, bool) {
	id, ok := ctx.Value(UserIDKey).(uuid.UUID)
	return id, ok
}

// peekTokenHeader decodes the JWT header without verifying the signature.
func peekTokenHeader(tokenStr string) (alg, kid string, err error) {
	parts := strings.Split(tokenStr, ".")
	if len(parts) != 3 {
		return "", "", fmt.Errorf("invalid token format")
	}
	headerBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", "", err
	}
	var header map[string]interface{}
	if err := json.Unmarshal(headerBytes, &header); err != nil {
		return "", "", err
	}
	alg, _ = header["alg"].(string)
	kid, _ = header["kid"].(string)
	return alg, kid, nil
}

// fetchECPublicKey fetches the JWKS endpoint and returns the EC public key for the given kid.
func fetchECPublicKey(jwksURL, kid string) (*ecdsa.PublicKey, error) {
	resp, err := http.Get(jwksURL)
	if err != nil {
		return nil, fmt.Errorf("fetch JWKS: %w", err)
	}
	defer resp.Body.Close()

	var jwks struct {
		Keys []struct {
			Kid string `json:"kid"`
			Kty string `json:"kty"`
			Crv string `json:"crv"`
			X   string `json:"x"`
			Y   string `json:"y"`
			// Also support x5c (certificate chain)
			X5c []string `json:"x5c"`
		} `json:"keys"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return nil, fmt.Errorf("decode JWKS: %w", err)
	}

	for _, key := range jwks.Keys {
		if kid != "" && key.Kid != kid {
			continue
		}
		if key.Kty == "EC" && key.X != "" && key.Y != "" {
			xBytes, err := base64.RawURLEncoding.DecodeString(key.X)
			if err != nil {
				continue
			}
			yBytes, err := base64.RawURLEncoding.DecodeString(key.Y)
			if err != nil {
				continue
			}
			pub := &ecdsa.PublicKey{
				Curve: elliptic.P256(),
				X:     new(big.Int).SetBytes(xBytes),
				Y:     new(big.Int).SetBytes(yBytes),
			}
			return pub, nil
		}
		// Fallback: parse from x5c certificate
		if len(key.X5c) > 0 {
			certBytes, err := base64.StdEncoding.DecodeString(key.X5c[0])
			if err != nil {
				continue
			}
			cert, err := x509.ParseCertificate(certBytes)
			if err != nil {
				continue
			}
			if pub, ok := cert.PublicKey.(*ecdsa.PublicKey); ok {
				return pub, nil
			}
		}
	}
	return nil, fmt.Errorf("no matching key found for kid=%s", kid)
}