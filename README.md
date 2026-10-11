# EduPrep AI

> **AI-Powered Personalized Student Preparation Platform**  
> *A Complete College Capstone Mini-Project built with Next.js, TypeScript, Tailwind CSS, Prisma ORM, Recharts, and Google Gemini API.*

---

## 📌 Problem Statement

School students (Class 6 - 12 CBSE / ICSE / State Boards) and competitive exam aspirants (JEE/NEET, College Exams) often struggle with fragmented learning tools—using separate applications for reading concepts, solving practice questions, taking timed tests, and attempting to track their weak areas manually. 

**EduPrep AI** solves this problem by providing a single, unified preparation platform where students can:
1. Select any target exam, class, board, subject, chapter, or topic from their curriculum.
2. Generate instant AI-crafted practice questions tailored to their target difficulty (Easy, Medium, Hard) and format (MCQs, 2-mark short descriptive, 5-mark long answer).
3. Take timed mock exams with automatic real-time evaluation and AI descriptive answer grading.
4. Extract questions directly from textbook photos or exam papers using multi-modal AI camera processing.
5. Visualize score trends and topic performance through intuitive charts.
6. Receive personalized, rule-based recommendations on what to study next based on their weak topics.

---

## 🎯 Objectives

- **Automated Gemini AI Question Generation**: Leverage official Google Gemini API (`@google/genai` / `gemini-2.5-flash`) with server-side prompt engineering to dynamically generate examination-oriented questions matching Indian curriculum standards.
- **Strict Data Validation & Resilience**: Validate AI responses using Zod schemas (`GeminiQuestionsResponseSchema`). If the AI service fails or no API key is provided, use only existing admin-approved database questions.
- **Human-in-the-Loop Quality Control**: Provide an Admin Panel where administrators can audit, approve, or reject AI-generated questions (`PENDING` → `APPROVED`/`REJECTED`) before adding them to the permanent question bank.
- **Real-Time Exam Engine**: Implement practice mode and timed mock test mode with a live countdown timer and automatic test submission.
- **Rule-Based Recommendation System**: Compute per-topic accuracy thresholds (<60% Weak, 60-80% Moderate, >80% Strong) and deliver personalized study advice.

---

## ✨ Features

- 🔐 **Authentication & Role-Based Access**: Secure JWT cookie-based session authentication (`jose`, `bcryptjs`) supporting both **Student** and **Admin** roles.
- 📚 **Comprehensive Curriculum Selection**: Multi-level cascading dropdowns covering Class 6 to Class 12 & Undergraduate level for CBSE, ICSE, and State Boards.
- 🤖 **Google Gemini AI Question Generator**: Dynamic server-side AI question generation powered by `gemini-2.5-flash` with customizable difficulty levels and question types (MCQ, Short 2-Mark, Long 5-Mark).
- 🛡️ **Resilient AI Fallback Engine**: Automatic graceful fallback to admin-approved database questions with notification banner if `GEMINI_API_KEY` is missing or unconfigured.
- 📝 **Practice & Timed Mock Test Modes**: Interactive question card navigation, live countdown timer with auto-submission, and backend-calculated scores.
- 📷 **Multi-modal Camera Question Extraction**: Process textbook images and extract structured questions using Gemini Vision / OCR capabilities.
- 📊 **Performance Analytics**: Interactive score trend line charts and topic accuracy bar charts powered by **Recharts**.
- 💡 **Weak-Topic Recommendations**: Automated identification of weak topics with targeted study advice.
- 🛡️ **Admin Quality Control Dashboard**: Comprehensive admin portal for curriculum CRUD and AI question approval/rejection.

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14/15 (App Router), TypeScript, Tailwind CSS, Lucide Icons |
| **Analytics** | Recharts |
| **Backend** | Next.js API Routes, Server Actions |
| **Database & ORM** | SQLite / PostgreSQL, Prisma ORM |
| **AI Integration** | Google Gemini API (`@google/genai` SDK / `gemini-2.5-flash`) |
| **Validation** | Zod Schemas (`GeminiQuestionsResponseSchema`) |
| **Authentication** | Custom JWT Session (`jose`, `bcryptjs`) |

---

## 🏗️ System Architecture

```
                 ┌──────────────────────────────────────┐
                 │       Student / Admin Browser        │
                 └──────────────────┬───────────────────┘
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │   Next.js App Router (Frontend UI)   │
                 └──────────────────┬───────────────────┘
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │       Auth & API Route Handlers      │
                 └──────────┬────────────────┬──────────┘
                            │                │
             ┌──────────────┘                └──────────────┐
             ▼                                              ▼
┌──────────────────────────────┐              ┌───────────────────────────┐
│     Google Gemini AI SDK     │              │  Prisma ORM & Database    │
│  (@google/genai + Zod Schema)│              │    (SQLite / PostgreSQL)  │
└──────────────┬───────────────┘              └───────────────────────────┘
               │ (Fallback if error/missing key)            ▲
               └────────────────────────────────────────────┘
```

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="your_google_gemini_api_key_here"
GEMINI_MODEL="gemini-2.5-flash"
AUTH_SECRET="eduprep-secret-key-capstone-2026-secure-jwt"
```
*(Note: If `GEMINI_API_KEY` is left blank, the application gracefully activates the Fallback Question Bank without throwing runtime crashes).*

### 4. Database Setup
Push the database schema. The seed script is intentionally non-destructive and does not create demo curriculum, questions, or accounts:
```bash
npx prisma generate
npx prisma db push
node prisma/seed.js
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Login Credentials (for Viva / Presentation)

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Student** | `student@example.com` | `student123` | Student Dashboard, Practice, Mock Test, Analytics, Recommendations |
| **Admin** | `admin@eduprep.ai` | `admin123` | Admin Dashboard, AI Question Approval Queue, Curriculum CRUD |

---

## 🔮 Future Scope

The following advanced capabilities are documented for future platform iterations:
- **PDF & Previous Year Paper Parsing**: Automatic extraction of questions from uploaded CBSE Board paper PDFs using OCR/RAG pipelines.
- **Expanded Examination Boards**: Direct integration with state educational boards and competitive entrance exams (JEE Main, NEET, UPSC).
- **RAG-based AI Tutor / Chatbot**: Interactive conversational study assistant for step-by-step doubt resolution.
- **Mobile Application**: Native mobile experience using React Native / Flutter.
- **Gamification**: Leaderboards, daily practice streaks, and achievement badges.
