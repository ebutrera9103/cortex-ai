# Cortex AI: Persistent Memory Toolkit for Node.js AI Apps

**Cortex AI** is a toolkit for developers who want to add secure, persistent, and context-aware memory to AI agents, chatbots, or multi-agent systems.  
It’s database-agnostic, highly extensible, and designed for real-world production needs.

---

## 🚀 What Can You Build With Cortex AI?

- **Persistent chat history** for chatbots and conversational agents
- **Shared memory** for multi-agent collaboration and asynchronous workflows
- **Context storage** for custom AI features: user preferences, research artifacts, knowledge graphs
- **Multi-tenant data partitioning** for SaaS, enterprise, or collaborative apps
- **Plug-and-play data backends:** Easily switch between Postgres, MongoDB, Redis, or your own custom adapter

---

## 🧠 Why Use Cortex AI?

- **Security-first:** Built for multi-user, multi-tenant scenarios
- **Decoupled by design:** Swap storage layers with a single line of code—your app logic stays clean
- **Scalable and production-ready:** Focused on reliability, extensibility, and developer happiness

---

## 🏗️ Quick Example: Save and Retrieve Chat History

```ts
// Save chat history for a user
await cortexServer.setMemory('user-123', 'chat-session-abc', { messages: [...] });

// Retrieve chat history later
const session = await cortexServer.getMemory('user-123', 'chat-session-abc');
```

---

## 🤖 Real-World Scenario: Multi-Agent Collaboration

Imagine a team of specialized bots writing a research report:

- **ResearcherBot** saves findings
- **SummarizerBot** pulls, summarizes, and updates context
- **WriterBot** assembles a final report

```ts
// 1. ResearcherBot saves articles
await cortexServer.setMemory('project-xyz', 'raw-articles', articles);

// 2. SummarizerBot retrieves and summarizes
const articlesContext = await cortexServer.getMemory('project-xyz', 'raw-articles');
if (articlesContext) {
  const summaries = articlesContext.data.map(/* summarize */);
  await cortexServer.setMemory('project-xyz', 'summarized-notes', summaries);
}

// 3. WriterBot builds the final report
const summariesContext = await cortexServer.getMemory('project-xyz', 'summarized-notes');
if (summariesContext) {
  await cortexServer.setMemory('project-xyz', 'final-report-draft', { report: /* ... */ });
}
```

---

## 🧑‍💼 Example: User Context and Topic Deduplication Across Multiple Bots

Imagine a company with several specialized bots (e.g. BillingBot, SupportBot, FeedbackBot) that interact with users.  
Cortex AI can track what topics a user has already discussed, allowing bots to respond intelligently and avoid repeating answers.

### Scenario: Tracking User Concerns

1. **A user contacts SupportBot about a billing issue.**
2. **Later, the user contacts BillingBot about the same topic.**
3. **BillingBot checks Cortex AI for existing concerns and finds the topic already discussed.**
4. **BillingBot can reference the previous conversation or escalate only if new info is given.**

```ts
const userId = 'user-555';
const topicKey = 'billing-concern-q3-2025';

// When a bot receives a new concern:
const previousConcern = await cortexServer.getMemory(userId, topicKey);

if (previousConcern) {
  // The user already mentioned this topic!
  // Reference or summarize previous response to avoid redundancy
  return {
    message:
      "We see you've already raised a billing concern recently. Here's what was discussed:",
    details: previousConcern.data,
  };
} else {
  // Save new concern to shared user context
  await cortexServer.setMemory(userId, topicKey, { details: userMessage });
  // Proceed with normal bot workflow
}
```

**Benefits:**

- Prevents duplicate tickets or responses
- Enables context-aware, collaborative support—each bot knows what others have handled
- Improves user experience by referencing prior interactions

---

## 🏁 Getting Started

1. **Install packages:**
   ```bash
   npm install express pg dotenv @cortex-ai/server @cortex-ai/adapter-postgres @cortex-ai/express
   ```
2. **Configure your environment:**
   ```env
   # .env file
   DATABASE_URL="postgresql://user:password@host:port/database"
   ```
3. **Create your server (`server.ts`):**

   ```ts
   import express from 'express';
   import { Pool } from 'pg';
   import { CortexServer } from '@cortex-ai/server';
   import { PostgresStorageAdapter } from '@cortex-ai/adapter-postgres';
   import { createCortexMiddleware } from '@cortex-ai/express';

   const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
   const storageAdapter = new PostgresStorageAdapter(pgPool);
   const cortexServer = new CortexServer(storageAdapter);
   storageAdapter.init().catch(console.error);

   const apiKeyValidator = async (tenantId, apiKey) => {
     // Example: validate API key per tenant
     return { 'customer-123': 'key-abc-789' }[tenantId] === apiKey;
   };

   const app = express();
   app.use(express.json());
   app.use(
     '/memory',
     createCortexMiddleware(cortexServer, { apiKeyValidator })
   );

   app.listen(3000, () =>
     console.log('✅ Server running on http://localhost:3000')
   );
   ```

---

## 🔌 Adapters: Examples, Not The Focus

Adapters let you connect Cortex AI to any database.  
**Included examples:**

- Redis
- MongoDB
- PostgreSQL
- In-memory (for development/testing)

> These are educational starting points—customize for production!

**Write your own adapter** for any cloud or enterprise backend in a few lines of code.

---

## 🧩 Core Concepts

- **CortexServer:** Main orchestrator for context/memory operations
- **Storage Adapters:** Plug in any backend by implementing the adapter interface
- **tenantId:** Secure partition per user/customer/project
- **contextId:** Unique key for each memory artifact (e.g. a chat session, document, or agent output)

---

## 📦 Packages

| Package                          | Description                               |
| -------------------------------- | ----------------------------------------- |
| **@cortex-ai/core**              | Core TypeScript interfaces                |
| **@cortex-ai/server**            | Main server logic                         |
| **@cortex-ai/adapter-in-memory** | Example non-persistent adapter            |
| **@cortex-ai/adapter-postgres**  | Example persistent adapter for PostgreSQL |
| **@cortex-ai/adapter-mongodb**   | Example persistent adapter for MongoDB    |
| **@cortex-ai/express**           | Express middleware for secure API         |

---

## 🛠️ Extending Cortex AI

- **Adapters:** Implement your own for any backend
- **Security:** Add custom API key or auth logic
- **Multi-tenancy:** Partition data simply and securely

---
