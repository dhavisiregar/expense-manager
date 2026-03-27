-- Migration: 003_fix_icon_emojis.sql
-- Fixes seeded categories that used Lucide icon name strings instead of emojis.
-- Run this once in your Supabase SQL Editor.

UPDATE categories SET icon = '🍔' WHERE icon = 'utensils';
UPDATE categories SET icon = '🚗' WHERE icon = 'car';
UPDATE categories SET icon = '🛍️' WHERE icon = 'shopping-bag';
UPDATE categories SET icon = '🎬' WHERE icon = 'film';
UPDATE categories SET icon = '❤️' WHERE icon = 'heart';
UPDATE categories SET icon = '🏠' WHERE icon = 'home';
UPDATE categories SET icon = '✈️' WHERE icon = 'plane';
UPDATE categories SET icon = '📚' WHERE icon = 'book';
UPDATE categories SET icon = '⚡' WHERE icon = 'zap';
UPDATE categories SET icon = '📦' WHERE icon = 'more-horizontal';
UPDATE categories SET icon = '🏷️' WHERE icon = 'tag';
