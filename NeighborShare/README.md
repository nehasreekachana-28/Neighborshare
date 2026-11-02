# NeighborShare

A beginner-friendly full-stack community item-sharing application. Users can list items, search and filter listings, request to borrow items, and accept or reject requests.

## Requirements

- Node.js (LTS version recommended)
- VS Code

No MongoDB installation is required. The project stores data in `db.json`.

## Run in VS Code

1. Extract the ZIP file.
2. Open the extracted `NeighborShare` folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Run:

   ```bash
   npm install
   npm start
   ```

5. Wait for this message:

   ```text
   NeighborShare running at http://localhost:3000
   ```

6. Open `http://localhost:3000` in your browser.
7. Keep the terminal running while you use the application. Press `Ctrl + C` to stop the server.

## Features

- Browse sample community listings
- Search by item name or description
- Filter by category
- Add an item to share
- Request to borrow an item
- Accept or reject borrow requests
- Delete a listing
- Store data locally in `db.json`

## Project structure

```text
NeighborShare/
├── package.json
├── server.js
├── db.json
├── README.md
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```

## Notes

This is a learning/demo project. It does not include authentication or owner-only permissions, so anyone using the local demo can manage listings and requests. The JSON file is suitable for learning and local testing, not production or concurrent multi-user use. Item images are supplied as image URLs rather than uploaded files.
