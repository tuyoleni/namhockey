# Namibia Hockey Mobile App

A mobile application developed for the **Namibia Hockey Union** to facilitate team management, player registration, event scheduling, and real-time updates.

- 📱 Built with **React Native (Expo)**
- 🔥 Backend powered by **Supabase**
- 🎨 Styled using **Nativewind + NativewindUI**
- ⚙️ Real-time features and native menus with **Supabase Realtime** and **Zeego**

---

## 📚 Table of Contents

1. [Repository](#repository)  
2. [Team Members](#team-members)  
3. [Introduction](#introduction)  
4. [Objectives](#objectives)  
5. [Technology Stack](#technology-stack)  
6. [Architecture Overview](#architecture-overview)  
7. [Functional Requirements](#functional-requirements)  
8. [UI & Navigation](#ui--navigation)  
9. [Team Responsibilities](#team-responsibilities)  
10. [Development Roadmap](#development-roadmap)  
11. [Testing & QA](#testing--qa)  
12. [Useful Links](#useful-links)  

---

## 📦 Repository

**GitHub:** [https://github.com/tuyoleni/namhockey.git](https://github.com/tuyoleni/namhockey.git)   

---

## 👥 Team Members

| Name                   | Student Number | Mode of Study | Role          |
|------------------------|----------------|----------------|---------------|
| Simeon Tuyoleni        | 222129298      | Part-Time      | Team Leader, Frontend & Backend |
| Flavia Kurz            | 222114592      | Full-Time      | Backend, Some Frontend       |
| Erastus Shindinge      | 222044438      | Full-Time      | Frontend, Some Backend      |
| Kelvin Gora            | 221026916      | Part-Time      | Backend, Some Frontend       |
| Tashinga Mataranyika   | 220076618      | Full-Time      | Backend, Some Frontend       |
| Lorraine Mwoyounotsva  | 222119578      | Full-Time      | Frontend, Some Backend      |

---

## 📖 Introduction

The Namibia Hockey Mobile App is designed to enhance engagement and streamline the operations of the Namibia Hockey Union. It enables teams and players to register, manage profiles, enroll in events, and receive real-time notifications.

---

## 🎯 Objectives

- **Team Registration** – Create and manage team profiles.
- **Event Management** – Schedule and register for hockey events.
- **Player Profiles** – Register and update player information.
- **Live Communication** – Real-time updates, alerts, and push notifications.
- **Unified UI/UX** – Smooth, consistent interface across Android, iOS, and Web.

---

## 🧱 Technology Stack

| Component      | Tool/Library                  | Purpose                                           |
|----------------|-------------------------------|---------------------------------------------------|
| Framework      | React Native (Expo)           | Cross-platform development                        |
| Backend        | Supabase                      | Auth, DB, Realtime APIs                           |
| Navigation     | Expo Router, Bottom Nav       | File-based routing and tabbed navigation          |
| Styling        | Nativewind & NativewindUI     | Utility-first styling and UI components           |
| Icons          | React Native Lucide Icons     | Scalable and customizable icons                   |
| State Mgmt     | Zustand                       | Lightweight global state management               |
| Menus          | Zeego                         | Cross-platform dropdown/context menu support      |
| Animations     | Reanimated                    | Smooth gestures and transitions                   |

---

## 📐 Architecture Overview

### 🖥️ Frontend
- Built with React Native using Expo
- Expo Router for navigation
- Nativewind for styling
- Zeego for native menu handling
- Zustand for state management

### ☁️ Backend
- Supabase for database, authentication, and real-time updates
- Tables: Teams, Players, Events, Registrations, Notifications

---

## ✅ Functional Requirements

### 🧑‍💼 Authentication
- User Registration and Login via Supabase
- Role-based access: Admin, Team, Player

### 🏑 Team & Player Management
- Create, edit team and player profiles
- Admin dashboard for data management

### 📅 Event Management
- Schedule events and register teams/players
- Real-time notifications on updates

### 📢 Real-Time Sharing
- Live scores and schedule updates via Supabase subscriptions
- In-app alerts using Zeego menus

---

## 🧭 UI & Navigation

- Bottom navigation for:
  - **Home**
  - **Events**
  - **Teams**
  - **Profile**
- Responsive, modern UI using Nativewind and Zeego
- Menu customizations for alerts and actions

---

## 👷 Team Responsibilities

### Frontend
- Develop screens using Expo and Nativewind
- Implement Expo Router + Bottom Navigation
- Integrate Zeego menus and Reanimated transitions
- Connect frontend to Supabase

### Backend
- Set up Supabase project and tables
- Manage roles, permissions, and auth logic
- Implement real-time subscriptions and secure APIs

---

## 🗺️ Development Roadmap

| Phase               | Key Tasks                                              | Assigned To |
|---------------------|--------------------------------------------------------|-------------|
| Setup & Planning    | Define roles, features, repo setup                     | All         |
| Environment Setup   | Configure Expo and Supabase, install dependencies      | All         |
| Auth Implementation | Supabase login, registration, role-based redirects     | All         |
| DB Schema Design    | Create Supabase tables (Teams, Events, etc.)           | Backend     |
| Navigation Setup    | Expo Router & Bottom Tabs                              | Frontend    |
| UI Development      | Home, Events, Teams, Profile screens                   | Frontend    |
| Realtime Features   | Supabase subscriptions for updates                     | Backend     |
| Alerts & Feedback   | In-app alerts with Zeego, push notifications (Expo)    | All         |
| Testing & QA        | Form validations, role testing, cross-platform checks  | All         |

---

## 🧪 Testing & QA

- Verify login flow for each user role
- Validate form submissions and event registrations
- Test Supabase real-time data updates
- Ensure cross-platform compatibility (iOS, Android, Web)

---

## 🔗 Useful Links

- [React Native (Expo)](https://expo.dev/)
- [Supabase](https://supabase.com/)
- [Nativewind](https://www.nativewind.dev/)
- [Zeego Menus](https://zeego.dev/)
- [Lucide Icons](https://lucide.dev/)
