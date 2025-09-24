````markdown
# Cortex AI: The Persistent Memory Toolkit for Node.js

A production-ready toolkit for giving your AI applications, agents, and chatbots a simple, secure, and persistent memory.

Cortex AI provides a powerful and intuitive way to manage the context and memory of AI systems. It's built on a pluggable adapter system, allowing you to start with a simple in-memory store and scale to production-grade databases like PostgreSQL and MongoDB without changing your core application logic.

---

## 📑 Table of Contents

- [What is Cortex AI?](#what-is-cortex-ai)
- [Cortex AI vs. The Official MCP SDK](#cortex-ai-vs-the-official-mcp-sdk)
- [Core Concepts](#core-concepts)
- [Available Packages](#-available-packages)
- [🚀 Quick Start: Secure API for Chat History](#-quick-start-secure-api-for-chat-history)
- [🤖 Advanced Usage: Multi-Agent Collaboration](#-advanced-usage-multi-agent-collaboration)
- [🚀 Quick Start: Secure API with PostgreSQL](#-quick-start-secure-api-with-postgresql)
- [🔌 Using a Different Adapter](#-using-a-different-adapter)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

---

## What is Cortex AI?

Cortex AI is designed with a core philosophy in mind:

- **Focus on Persistence**: The primary goal is to be the best-in-class solution for storing and retrieving AI context data.
- **Decoupled by Design**: Your application logic should not be tied to your database. Swap out storage backends with a single line of code.
- **Security First**: Built with multi-tenancy and security as first-class concepts.

---

## Cortex AI vs. The Official MCP SDK

This is a crucial distinction. The two projects are designed to solve different problems:

- **Cortex AI (This Library)** is a specialized database toolkit for AI memory.
  - Its primary job is to securely store and retrieve context data (like chat history or user preferences) so it can be used later.
  - It is focused on persistence and data management.
  - Think of it as the **secure bank vault** for an AI's long-term memory.

- **The Official `typescript-sdk`** is a full API framework for real-time AI communication.
  - Its primary job is to manage the live, back-and-forth conversation between an AI application (the "client") and a set of tools (the "server") according to a strict protocol.
  - It is focused on live interaction and protocol compliance.
  - Think of it as a **busy telephone switchboard**.

✅ **Choose Cortex AI** when your main goal is to add a simple, secure, and reliable persistent memory layer to your application.

---

## Core Concepts

- **`CortexServer`**: The main class from `@cortex-ai/server`. It orchestrates all operations.
- **Storage Adapters**: Pluggable backends that connect the `CortexServer` to a database. You can easily create your own.
- **`tenantId`**: The top-level identifier to ensure data is securely partitioned between different users or customers.
- **`contextId`**: The identifier for a specific piece of memory within a tenant's partition (e.g., a single chat session).

---

## 📦 Available Packages

| Package                          | Description                                                      |
| -------------------------------- | ---------------------------------------------------------------- |
| **@cortex-ai/core**              | Defines the core TypeScript interfaces (`ICortexService`, etc.). |
| **@cortex-ai/server**            | The main `CortexServer` logic.                                   |
| **@cortex-ai/adapter-in-memory** | A non-persistent adapter for development and testing.            |
| **@cortex-ai/adapter-postgres**  | A production-ready, persistent storage adapter using PostgreSQL. |
| **@cortex-ai/adapter-mongodb**   | A production-ready, persistent storage adapter using MongoDB.    |
| **@cortex-ai/express**           | Express middleware to expose the memory server as a secure API.  |

---

## 🚀 Quick Start: Secure API for Chat History

This example shows how to add a secure, persistent memory to a chatbot using Express and PostgreSQL.  
_(For the full code, see the [Quick Start Guide](#-quick-start-secure-api-with-postgresql))._

---

## 🤖 Advanced Usage: Multi-Agent Collaboration

The true power of Cortex AI is unlocked when it's used as a shared memory space, or **"collaboration hub,"** for multiple AI agents working together on a complex task.

**The pattern is simple:**

- `tenantId` = The **Project ID**. This creates a secure, isolated workspace for the task.
- `contextId` = The **Artifact ID**. This is a specific piece of data an agent produces or consumes.

---

### Scenario: An AI Research Team

Imagine a team of specialized bots writing a research report: a **ResearcherBot**, a **SummarizerBot**, and a **WriterBot**. They use Cortex AI to collaborate asynchronously.

---

#### 1. The ResearcherBot saves its findings:

```ts
const projectId = 'project-market-analysis-q4';
const rawDataArtifactId = 'raw-articles';

const articles = [
  { source: 'https://techcrunch.com/...', content: '...' },
  { source: 'https://wsj.com/...', content: '...' },
];

// The ResearcherBot saves its findings to the shared workspace.
await cortexServer.setMemory(projectId, rawDataArtifactId, articles);
```
````

---

#### 2. The SummarizerBot retrieves the data and adds its work:

```ts
const projectId = 'project-market-analysis-q4';
const summaryArtifactId = 'summarized-notes';

// It retrieves the data left by the ResearcherBot.
const articlesContext = await cortexServer.getMemory(projectId, 'raw-articles');

if (articlesContext) {
  const summaries = articlesContext.data.map((article) => ({
    /* ... summarize ... */
  }));

  // It saves its own work back to a *new* artifact in the same project workspace.
  await cortexServer.setMemory(projectId, summaryArtifactId, summaries);
}
```

---

#### 3. The WriterBot creates the final report:

```ts
const projectId = 'project-market-analysis-q4';
const finalReportArtifactId = 'final-report-draft-1';

// It retrieves the summaries left by the SummarizerBot.
const summariesContext = await cortexServer.getMemory(
  projectId,
  'summarized-notes'
);

if (summariesContext) {
  const finalReport = 'Here is the final report based on the summaries...';

  // It saves the final product to the workspace.
  await cortexServer.setMemory(projectId, finalReportArtifactId, {
    report: finalReport,
  });
}
```

---

## 🚀 Quick Start: Secure API with PostgreSQL

This example shows how to add a secure, persistent memory to a chatbot using Express and PostgreSQL.

### 1. Installation

```bash
# Install Cortex AI packages and their dependencies
npm install express pg dotenv @cortex-ai/server @cortex-ai/adapter-postgres @cortex-ai/express
```

### 2. Set Up Your Environment

```env
# .env file
DATABASE_URL="postgresql://user:password@host:port/database"
```

### 3. Create Your Server (`server.ts`)

```ts
import 'dotenv/config';
import express from 'express';
import { Pool } from 'pg';
import { CortexServer } from '@cortex-ai/server';
import { PostgresStorageAdapter } from '@cortex-ai/adapter-postgres';
import { createCortexMiddleware } from '@cortex-ai/express';

// --- 1. Connect to your database ---
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// --- 2. Initialize the Cortex AI Server ---
const storageAdapter = new PostgresStorageAdapter(pgPool);
const cortexServer = new CortexServer(storageAdapter);

// Initialize the database table if it doesn't exist
storageAdapter.init().catch(console.error);

// --- 3. Set up API Key Security (Example) ---
const apiKeyValidator = async (
  tenantId: string,
  apiKey: string
): Promise<boolean> => {
  // In a real app, you would look this up in a database.
  const validKeys: Record<string, string> = { 'customer-123': 'key-abc-789' };
  return validKeys[tenantId] === apiKey;
};

// --- 4. Set up the Express App & Middleware ---
const app = express();
app.use(express.json());
app.use('/memory', createCortexMiddleware(cortexServer, { apiKeyValidator }));

// --- 5. Start the server ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Secure Cortex AI server running on http://localhost:${PORT}`);
});
```

### 4. Test Your API

```bash
# Set a conversation history for customer-123 (Success)
curl -X POST http://localhost:3000/memory/customer-123/chat-session-abc \
     -H "X-API-KEY: key-abc-789" \
     -H "Content-Type: application/json" \
     -d '{ "messages": ["Hello from Postgres!"] }'

# Get the conversation history (Success)
curl http://localhost:3000/memory/customer-123/chat-session-abc \
     -H "X-API-KEY: key-abc-789"
```

---

## 🔌 Using a Different Adapter

To switch the example above to MongoDB, only a few lines change:

```bash
npm install mongodb @cortex-ai/adapter-mongodb
```

```ts
import { MongoClient } from 'mongodb';
import { MongoDbStorageAdapter } from '@cortex-ai/adapter-mongodb';

const mongoClient = new MongoClient(process.env.MONGO_URL as string);
await mongoClient.connect();

const storageAdapter = new MongoDbStorageAdapter(mongoClient.db('my-ai-app'));
const cortexServer = new CortexServer(storageAdapter);
```

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's a bug fix, a new feature, or a new storage adapter, we'd love to see it. Please read our **Contributing Guide** to get started.

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.

```

```
