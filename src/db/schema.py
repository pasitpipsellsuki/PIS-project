from __future__ import annotations

"""
Database Schema Types
Product Information System - TypeScript-style types for D1 database
"""

from typing import Optional
from dataclasses import dataclass
from datetime import datetime


# ============================================
# PRODUCT TYPES
# ============================================

@dataclass
class Product:
    """Represents a product in the catalog."""
    id: str  # UUID v4
    sku: str
    name: str
    description: Optional[str]
    category: Optional[str]
    price: Optional[float]
    created_at: str
    updated_at: str
    is_active: int = 1  # 0 = deleted, 1 = active
    
    @classmethod
    def from_row(cls, row: dict) -> Product:
        """Create Product instance from database row."""
        return cls(
            id=row['id'],
            sku=row['sku'],
            name=row['name'],
            description=row.get('description'),
            category=row.get('category'),
            price=row.get('price'),
            is_active=row.get('is_active', 1),
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    
    def to_dict(self) -> dict:
        """Convert to dictionary for API responses."""
        return {
            'id': self.id,
            'sku': self.sku,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'price': self.price,
            'is_active': bool(self.is_active),
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }


@dataclass
class ProductCreate:
    """Data required to create a new product."""
    sku: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None


@dataclass
class ProductUpdate:
    """Data for updating an existing product."""
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    is_active: Optional[int] = None


# ============================================
# LOCATION TYPES
# ============================================

@dataclass
class Location:
    """Represents a store or warehouse location."""
    id: str  # UUID v4
    name: str
    type: str  # 'store' or 'warehouse'
    address: Optional[str]
    created_at: str
    
    @classmethod
    def from_row(cls, row: dict) -> Location:
        """Create Location instance from database row."""
        return cls(
            id=row['id'],
            name=row['name'],
            type=row['type'],
            address=row.get('address'),
            created_at=row['created_at']
        )
    
    def to_dict(self) -> dict:
        """Convert to dictionary for API responses."""
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'address': self.address,
            'created_at': self.created_at
        }


@dataclass
class LocationCreate:
    """Data required to create a new location."""
    name: str
    type: str  # 'store' or 'warehouse'
    address: Optional[str] = None


@dataclass
class LocationUpdate:
    """Data for updating an existing location."""
    name: Optional[str] = None
    address: Optional[str] = None


# ============================================
# INVENTORY TYPES
# ============================================

@dataclass
class Inventory:
    """Represents stock level for a product at a specific location."""
    id: str  # UUID v4
    product_id: str
    location_id: str
    quantity: int
    min_stock_level: int
    last_updated: str
    
    # Joined fields (optional)
    product_sku: Optional[str] = None
    product_name: Optional[str] = None
    location_name: Optional[str] = None
    location_type: Optional[str] = None
    
    @classmethod
    def from_row(cls, row: dict) -> Inventory:
        """Create Inventory instance from database row."""
        return cls(
            id=row['id'],
            product_id=row['product_id'],
            location_id=row['location_id'],
            quantity=row['quantity'],
            min_stock_level=row['min_stock_level'],
            last_updated=row['last_updated'],
            product_sku=row.get('product_sku'),
            product_name=row.get('product_name'),
            location_name=row.get('location_name'),
            location_type=row.get('location_type')
        )
    
    def to_dict(self) -> dict:
        """Convert to dictionary for API responses."""
        result = {
            'id': self.id,
            'product_id': self.product_id,
            'location_id': self.location_id,
            'quantity': self.quantity,
            'min_stock_level': self.min_stock_level,
            'last_updated': self.last_updated
        }
        
        # Add joined fields if available
        if self.product_sku:
            result['product_sku'] = self.product_sku
        if self.product_name:
            result['product_name'] = self.product_name
        if self.location_name:
            result['location_name'] = self.location_name
        if self.location_type:
            result['location_type'] = self.location_type
            
        return result
    
    @property
    def is_low_stock(self) -> bool:
        """Check if stock is at or below minimum level."""
        return self.quantity <= self.min_stock_level


@dataclass
class InventoryCreate:
    """Data required to create a new inventory record."""
    product_id: str
    location_id: str
    quantity: int = 0
    min_stock_level: int = 0


@dataclass
class InventoryUpdate:
    """Data for updating inventory."""
    quantity: Optional[int] = None
    min_stock_level: Optional[int] = None


@dataclass
class StockAdjustment:
    """Data for adjusting stock quantity."""
    quantity_delta: int  # Positive for stock in, negative for stock out
    reason: Optional[str] = None  # e.g., 'sale', 'receipt', 'adjustment'


# ============================================
# VIEW TYPES
# ============================================

@dataclass
class ProductInventorySummary:
    """Summary of product inventory across all locations."""
    product_id: str
    sku: str
    name: str
    category: Optional[str]
    price: Optional[float]
    is_active: int
    location_count: int
    total_stock: int
    min_stock_at_location: int
    max_stock_at_location: int
    
    @classmethod
    def from_row(cls, row: dict) -> ProductInventorySummary:
        return cls(
            product_id=row['product_id'],
            sku=row['sku'],
            name=row['name'],
            category=row.get('category'),
            price=row.get('price'),
            is_active=row['is_active'],
            location_count=row['location_count'],
            total_stock=row['total_stock'],
            min_stock_at_location=row['min_stock_at_location'],
            max_stock_at_location=row['max_stock_at_location']
        )
    
    def to_dict(self) -> dict:
        return {
            'product_id': self.product_id,
            'sku': self.sku,
            'name': self.name,
            'category': self.category,
            'price': self.price,
            'is_active': bool(self.is_active),
            'location_count': self.location_count,
            'total_stock': self.total_stock,
            'min_stock_at_location': self.min_stock_at_location,
            'max_stock_at_location': self.max_stock_at_location
        }


@dataclass
class LowStockAlert:
    """Low stock alert item."""
    product_id: str
    sku: str
    name: str
    location_id: str
    location_name: str
    location_type: str
    quantity: int
    min_stock_level: int
    shortage: int
    
    @classmethod
    def from_row(cls, row: dict) -> LowStockAlert:
        return cls(
            product_id=row['product_id'],
            sku=row['sku'],
            name=row['name'],
            location_id=row['location_id'],
            location_name=row['location_name'],
            location_type=row['location_type'],
            quantity=row['quantity'],
            min_stock_level=row['min_stock_level'],
            shortage=row['shortage']
        )
    
    def to_dict(self) -> dict:
        return {
            'product_id': self.product_id,
            'sku': self.sku,
            'name': self.name,
            'location_id': self.location_id,
            'location_name': self.location_name,
            'location_type': self.location_type,
            'quantity': self.quantity,
            'min_stock_level': self.min_stock_level,
            'shortage': self.shortage
        }


@dataclass
class LocationInventorySummary:
    """Summary of inventory at a location."""
    location_id: str
    location_name: str
    location_type: str
    product_count: int
    total_units: int
    low_stock_items: int
    
    @classmethod
    def from_row(cls, row: dict) -> LocationInventorySummary:
        return cls(
            location_id=row['location_id'],
            location_name=row['location_name'],
            location_type=row['location_type'],
            product_count=row['product_count'],
            total_units=row['total_units'],
            low_stock_items=row['low_stock_items']
        )
    
    def to_dict(self) -> dict:
        return {
            'location_id': self.location_id,
            'location_name': self.location_name,
            'location_type': self.location_type,
            'product_count': self.product_count,
            'total_units': self.total_units,
            'low_stock_items': self.low_stock_items
        }
