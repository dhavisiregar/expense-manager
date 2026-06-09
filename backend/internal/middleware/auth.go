package middleware

import (
	"context"
	"crypto/rsa"
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

		alg, kid, err := peekTokenHeader(tokenStr)
		if err != nil {
			response.Error(w, http.StatusUnauthorized, "malformed token")
			return
		}

		projectID := os.Getenv("FIREBASE_PROJECT_ID")
		if projectID == "" {
			response.Error(w, http.StatusInternalServerError, "missing FIREBASE_PROJECT_ID")
			return
		}

		var token *jwt.Token

		switch alg {
		case "RS256":
			jwksURL := "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
			pubKey, keyErr := fetchRSAPublicKey(jwksURL, kid)
			if keyErr != nil {
				response.Error(w, http.StatusUnauthorized, "could not fetch signing key")
				return
			}
			token, err = jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
				}
				return pubKey, nil
			},
				jwt.WithAudience(projectID),
				jwt.WithIssuer("https://securetoken.google.com/"+projectID),
			)

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

		ctx := context.WithValue(r.Context(), UserIDKey, sub)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func GetUserID(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(UserIDKey).(string)
	return id, ok
}

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

func fetchRSAPublicKey(jwksURL, kid string) (*rsa.PublicKey, error) {
	resp, err := http.Get(jwksURL)
	if err != nil {
		return nil, fmt.Errorf("fetch JWKS: %w", err)
	}
	defer resp.Body.Close()

	var jwks struct {
		Keys []struct {
			Kid string   `json:"kid"`
			Kty string   `json:"kty"`
			N   string   `json:"n"`
			E   string   `json:"e"`
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
		// Parse from n/e fields
		if key.Kty == "RSA" && key.N != "" && key.E != "" {
			nBytes, err := base64.RawURLEncoding.DecodeString(key.N)
			if err != nil {
				continue
			}
			eBytes, err := base64.RawURLEncoding.DecodeString(key.E)
			if err != nil {
				continue
			}
			e := 0
			for _, b := range eBytes {
				e = e<<8 + int(b)
			}
			pub := &rsa.PublicKey{
				N: new(big.Int).SetBytes(nBytes),
				E: e,
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
			if pub, ok := cert.PublicKey.(*rsa.PublicKey); ok {
				return pub, nil
			}
		}
	}
	return nil, fmt.Errorf("no matching key found for kid=%s", kid)
}
