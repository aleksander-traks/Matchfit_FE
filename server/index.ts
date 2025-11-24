import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import clientRoutes from './routes/client';
import dashboardRoutes from './routes/dashboard';
import messagesRoutes from './routes/messages';
import matchingRoutes from './routes/matching';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/client', clientRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/matching', matchingRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
