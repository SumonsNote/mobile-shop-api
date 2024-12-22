# E-commerce API Documentation

Base URL: `https://api.yourdomain.com/v1`

## Authentication

All API requests require a Bearer token in the Authorization header:

```http
Authorization: Bearer <your_token>
```

## Products API

### Get All Products
```http
GET /api/products
```

Query Parameters:
| Parameter  | Type    | Description                    |
|------------|---------|--------------------------------|
| page       | integer | Page number (default: 1)       |
| limit      | integer | Items per page (default: 10)   |
| category   | string  | Filter by category             |
| search     | string  | Search in name and description |
| sort       | string  | Sort by field (price, date)    |

Response:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "price": "number",
        "category": "string",
        "images": ["string"],
        "stock": "number",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "totalItems": "number",
    "currentPage": "number",
    "totalPages": "number"
  }
}
```

### Get Single Product
```http
GET /api/products/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "price": "number",
    "category": "string",
    "images": ["string"],
    "stock": "number",
    "specifications": "object",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### Create Product
```http
POST /api/products
```

Request Body:
```json
{
  "name": "string (required)",
  "description": "string (required)",
  "price": "number (required)",
  "category": "string (required)",
  "images": ["string"],
  "stock": "number (required)",
  "specifications": "object"
}
```

### Update Product
```http
PUT /api/products/:id
```

Request Body: Same as Create Product (all fields optional)

### Delete Product
```http
DELETE /api/products/:id
```

## Orders API

### Get All Orders
```http
GET /api/orders
```

Query Parameters:
| Parameter  | Type    | Description                     |
|------------|---------|----------------------------------|
| page       | integer | Page number (default: 1)         |
| limit      | integer | Items per page (default: 10)     |
| status     | string  | Filter by status                 |
| dateFrom   | string  | Filter by date (YYYY-MM-DD)      |
| dateTo     | string  | Filter by date (YYYY-MM-DD)      |

Response:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "string",
        "userId": "string",
        "products": [
          {
            "productId": "string",
            "quantity": "number",
            "price": "number"
          }
        ],
        "totalAmount": "number",
        "status": "string",
        "shippingAddress": "object",
        "paymentStatus": "string",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "totalItems": "number",
    "currentPage": "number",
    "totalPages": "number"
  }
}
```

### Create Order
```http
POST /api/orders
```

Request Body:
```json
{
  "products": [
    {
      "productId": "string (required)",
      "quantity": "number (required)"
    }
  ],
  "shippingAddress": {
    "street": "string (required)",
    "city": "string (required)",
    "state": "string (required)",
    "zipCode": "string (required)",
    "country": "string (required)"
  },
  "paymentMethod": "string (required)"
}
```

### Update Order Status
```http
PUT /api/orders/:id/status
```

Request Body:
```json
{
  "status": "string (required)",
  "note": "string"
}
```

## Users API

### Get All Users
```http
GET /api/users
```

Query Parameters:
| Parameter  | Type    | Description                    |
|------------|---------|--------------------------------|
| page       | integer | Page number (default: 1)       |
| limit      | integer | Items per page (default: 10)   |
| role       | string  | Filter by role                 |
| search     | string  | Search in name and email       |

### Create User
```http
POST /api/users
```

Request Body:
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required)",
  "role": "string (default: customer)"
}
```

### Update User
```http
PUT /api/users/:id
```

Request Body:
```json
{
  "name": "string",
  "email": "string",
  "role": "string"
}
```

## Error Responses

All endpoints follow the same error response format:

```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  }
}
```

Common Error Codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error

## Rate Limiting

- Rate limit: 100 requests per minute
- Exceeded rate limit response: HTTP 429 (Too Many Requests)

## Webhooks

### Order Status Updates
```http
POST /webhooks/orders
```

Payload:
```json
{
  "orderId": "string",
  "status": "string",
  "timestamp": "string",
  "metadata": "object"
}
```

## Testing

Base URL for testing: `https://api-staging.yourdomain.com/v1`

Test credentials:
```json
{
  "email": "test@example.com",
  "password": "test1234"
}
```
