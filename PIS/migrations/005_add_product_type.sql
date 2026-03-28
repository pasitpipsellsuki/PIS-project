-- Migration: 005_add_product_type.sql
-- Sprint 6: PT-001 - Add product_type field to products table
-- Created: 2026-03-28

ALTER TABLE products ADD COLUMN product_type TEXT NOT NULL DEFAULT 'physical' CHECK(product_type IN ('physical', 'digital', 'service'));
