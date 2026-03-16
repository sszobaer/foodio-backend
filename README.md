# 🍽️ Foodio - Restaurant Ordering System Backend API

Foodio is a **restaurant ordering backend system** built with **NestJS, PostgreSQL, and TypeORM**.
It powers menu browsing, ordering, and an admin panel to manage menu items and orders.

This backend is designed with **clean architecture, validation, authentication, and role-based access control**, making it suitable for production environments or as a strong backend project.

---

# 📑 Table of Contents

* [Project Overview](#project-overview)
* [Tech Stack](#tech-stack)
* [Key Features](#key-features)
* [Project Structure](#project-structure)
* [Environment Variables](#environment-variables)
* [Local Development Setup](#local-development-setup)
* [Cloudinary Setup (Image Storage)](#cloudinary-setup-image-storage)
* [Running the Application](#running-the-application)
* [Railway Deployment](#railway-deployment)
* [Postman API Documentation](#postman-api-documentation)
* [API Overview](#api-overview)
* [Authentication & Roles](#authentication--roles)
* [File Upload Handling](#file-upload-handling)
* [Database Design](#database-design)
* [Useful Scripts](#useful-scripts)
* [Future Improvements](#future-improvements)

---

# Project Overview

Foodio is a **simplified restaurant ordering system** where users can browse menu items, add them to a cart, and place orders.

The backend handles:

* Authentication
* Menu browsing
* Category filtering
* Order placement
* Order tracking
* Admin menu management
* Image uploads for menu items

The frontend cart lives in **localStorage**, and the backend receives the final cart data to create a single order transaction.

---

# Tech Stack

Backend Framework
[NestJS](https://nestjs.com)

Database
[PostgreSQL](https://www.postgresql.org)

ORM
[TypeORM](https://typeorm.io)

Authentication
[JWT (JSON Web Token)](https://jwt.io)

Image Storage
[Cloudinary](https://cloudinary.com)

Deployment Platform
[Railway](https://railway.app)

Validation
[class-validator](https://github.com/typestack/class-validator)

---

# Key Features

## Public Users

* Browse menu categories
* View menu items grouped by category
* Search menu items by name
* Filter menu items by availability
* View menu item details

## Authenticated Users

* Register and login
* Place orders
* Track order status
* View order history

## Admin Users

* Create / update / delete categories
* Manage menu items
* Upload food images
* Control item availability
* Manage order queue
* Update order status

---

# Project Structure

```txt
src
│
├── auth
├── users
├── categories
├── menu-items
├── orders
├── cloudinary
├── common
│
├── app.module.ts
└── main.ts
```

Modules follow a **clean modular architecture** where each module contains:

* DTOs
* Entities
* Controller
* Service
* Module definition

---

# Environment Variables

Create a `.env` file in the project root.

Example:

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_NAME=foodio_dev

NODE_ENV=development

JWT_SECRET=foodio_super_secret_key
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

For Railway deployment you will use:

```
DATABASE_URL=postgresql://...
```

---

# Local Development Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/sszobaer/foodio-backend.git
cd foodio-backend
```

---

### 2️⃣ Install dependencies

```bash
npm install
```

---

### 3️⃣ Setup PostgreSQL

Install PostgreSQL if needed:

https://www.postgresql.org/download/

Create a database:

```
foodio_dev
```

Update your `.env` file with the correct database credentials.

---

### 4️⃣ Configure environment variables

Create `.env` file using the configuration shown above.

---

# Cloudinary Setup (Image Storage)

Menu item images are stored in **Cloudinary**.

### 1️⃣ Create a Cloudinary account

https://cloudinary.com/users/register/free

---

### 2️⃣ Get your credentials

Open your dashboard:

https://console.cloudinary.com/

Copy the following values:

* Cloud Name
* API Key
* API Secret

---

### 3️⃣ Add them to `.env`

```
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx
```

---

### 4️⃣ Upload images

Menu item creation accepts **multipart/form-data**.

Example request:

```
POST /menu-items
```

Form Data:

```
name: Burger
description: Cheese burger
price: 299
categoryId: uuid
image: (file)
```

Cloudinary stores the image and returns a **URL**, which is saved in PostgreSQL.

---

# Running the Application

Development mode:

```bash
npm run start:dev
```

Production build:

```bash
npm run build
npm run start:prod
```

Server runs at:

```
http://localhost:5000
```

---

# Railway Deployment

Railway is used for hosting the backend and PostgreSQL database.

### 1️⃣ Create Railway project

https://railway.app

---

### 2️⃣ Add PostgreSQL

Add the PostgreSQL plugin inside Railway.
Railway automatically generates:

```
DATABASE_URL
```

---

### 3️⃣ Add environment variables

Inside Railway dashboard → **Variables** add:

```
JWT_SECRET
JWT_EXPIRES_IN

CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

---

### 4️⃣ Deploy

Connect your GitHub repository to Railway and deploy.

Railway automatically runs:

```
npm install
npm run build
npm start
```

The database connection automatically uses:

```
DATABASE_URL
```

---

# Postman API Documentation

A complete **Postman collection** is included with the repository to help test the API quickly.

You can find it here:

```
https://drive.google.com/file/d/1DjIZSpGEEp30KmkW_zu9i4oWTRPUzUGQ/view?usp=drive_link
```

### How to use

1. Open **Postman**
2. Click **Import**
3. Select the file:

```
Foodio.postman_collection.json
```

4. Set the base URL environment variable

Example:

```
http://localhost:3000
```

This collection includes ready-to-use requests for:

* Authentication
* Categories
* Menu Items
* Orders
* Admin routes

---

# API Overview

### Authentication

```
POST /auth/register
POST /auth/login
GET  /auth/me
```

---

### Categories

```
GET    /categories
GET    /categories/admin
POST   /categories
PATCH  /categories/:id
DELETE /categories/:id
```

---

### Menu Items

```
GET    /menu-items
GET    /menu-items/admin
GET    /menu-items/:id
POST   /menu-items
PATCH  /menu-items/:id
PATCH  /menu-items/:id/availability
DELETE /menu-items/:id
```

---

### Orders

```
POST /orders
GET  /orders/my-orders
GET  /orders/my-orders/:id

GET  /orders
GET  /orders/:id
PATCH /orders/:id/status
```

---

# Authentication & Roles

Two roles exist in the system:

```
ADMIN
CUSTOMER
```

Routes are protected using:

* `JwtAuthGuard`
* `RolesGuard`

Example:

```
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
```

---

## Authentication

Authentication supports both cookies and bearer tokens. The server sets a cookie named `accessToken` on `POST /auth/login` and `POST /auth/register`, and clears it on `POST /auth/logout`. Browser clients can rely on cookies (send requests with `credentials: 'include'`), while non-browser clients (mobile apps, API clients) can use the `Authorization: Bearer <token>` header.

Fetch example (browser):
```
fetch('http://localhost:5000/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
```

Axios example (browser):
```
axios.post('http://localhost:5000/auth/login', { email, password }, { withCredentials: true });
```

Postman: either use the **Cookies** tab to view/send the `accessToken` cookie or add an `Authorization: Bearer <token>` header to requests.

Use `GET /auth/me` to fetch the authenticated user's data.


# File Upload Handling

Images are uploaded using:

* `multer`
* `Cloudinary`

The server receives the file, uploads it to Cloudinary, and stores the returned URL in the database.

---

# Database Design

Main tables:

```
users
categories
menu_items
orders
order_items
```

Relationships:

```
User → Orders
Order → OrderItems
MenuItem → OrderItems
Category → MenuItems
```

---

# Useful Scripts

Install dependencies

```
npm install
```

Run development server

```
npm run start:dev
```

Build project

```
npm run build
```

Run production build

```
npm run start:prod
```

---

# Author

Foodio Backend API
Built with **NestJS + PostgreSQL + Cloudinary**
