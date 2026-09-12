# Illustra API Reference

AI-art gallery API. 

Base URL: `/api/v1/lab`
Deployed: https://phi-lab-server.vercel.app/api/v1/lab
Source: `src/app/api/lab/apis/illustra/`
- Controller: `illustra.controller.ts`
- Routes: `lab.route.ts`
- Data: `categories.json`, `photos.json`

## Endpoints

### GET `/photos/categories`
List all photo categories.

**Response 200**
```json
{
  "status": "success",
  "message": "Photo categories fetched successfully",
  "data": [
    { "id": 1, "name": "Sci-Fi", "slug": "scifi" },
    { "id": 2, "name": "Pixel Art", "slug": "pixel-art" }
  ]
}
```

---

### GET `/photos`
List all photos.

**Response 200**
```json
{
  "status": "success",
  "message": "Photos fetched successfully",
  "data": [ /* Photo[] */ ]
}
```

---

### GET `/photos/:id`
Single photo by numeric `id`.

**Response 200**
```json
{
  "status": "success",
  "message": "Photos with id 1 fetched successfully",
  "data": { /* Photo */ }
}
```

**Response 404** — no photo matches `id`
```json
{ "status": "error", "message": "No Photo found with id {id}" }
```

---

### GET `/photos/category/:id`
Filter photos by category `id`. Looks up the category by `id`, then matches photos case-insensitively against that category's `name`.

**Response 200**
```json
{
  "status": "success",
  "message": "Photos with categoryId {id} fetched successfully",
  "data": [ /* Photo[] */ ]
}
```

**Response 404** — no category matches `id`
```json
{ "status": "error", "message": "No category found with id {id}" }
```

**Response 404** — category exists but has no photos
```json
{ "status": "error", "message": "No photo found with categoryId {id}" }
```

**Example**
```
GET /api/v1/lab/photos/category/7
```

## Data Shapes

### Category
| Field | Type   |
|-------|--------|
| id    | number |
| name  | string |
| slug  | string |

### Photo
| Field       | Type     | Notes                          |
|-------------|----------|---------------------------------|
| id          | number   |                                 |
| title       | string   |                                 |
| imageUrl    | string   | external image URL              |
| prompt      | string   | AI generation prompt            |
| category    | string   | matches a Category `name`       |
| model       | string   | e.g. `"SDXL"`                    |
| resolution  | string   | e.g. `"768x1024"`                |
| likes       | number   |                                 |
| downloads   | number   |                                 |
| createdAt   | string   | ISO 8601 timestamp              |
| tags        | string[] |                                 |

## Known issues
- All data static/in-memory (`categories.json`, `photos.json`) — no create/update/delete endpoints.
