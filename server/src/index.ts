import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './resolvers/index.js';
import { verifyToken } from './utils/auth.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || '';

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error', err);
    process.exit(1);
  }

  const app = express();
  const httpServer = createServer(app);

  const corsOptions: cors.CorsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:4000',
    'https://geomaster-tau.vercel.app',
    'https://geomaster-server.onrender.com',
    process.env.CLIENT_URL,
  ].filter((origin): origin is string => Boolean(origin)),
  credentials: true,
};

  app.use(cors(corsOptions));

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer({
    schema,
    context: async (ctx) => {
      return ctx;
    },
  }, wsServer);

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  app.use('/graphql', express.json(), expressMiddleware(server, {
    context: async ({ req }) => {
      const token = req.headers.authorization || '';
      const user = verifyToken(token.replace('Bearer ', ''));
      return { user };
    },
  }));

  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok',
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`Server ready at http://localhost:${PORT}/graphql`);
    console.log(`Subscriptions ready at ws://localhost:${PORT}/graphql`);
  });
}

startServer();