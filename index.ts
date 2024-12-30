import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.routes.js";
import mahasiswaRoutes from "./src/routes/mahasiswa.routes.js";
import koordinatorRoutes from "./src/routes/koordinator.routes";
import pembimbinginstansiRoutes from "./src/routes/pembimbinginstansi.routes";
import dosenPembimbingRoutes from "./src/routes/dosenpembimbing.routes";
import dosenpengujiRoutes from "./src/routes/dosenpenguji.routes";
import profileRoutes from "./src/routes/profile.routes";
import scheduleRoutes from "./src/routes/schedule.routes";
import { errorHandler } from "./src/middlewares/errorHandler.middleware";

const app = express();
const port = 5000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

app.use("/sitrack", authRoutes);
app.use("/sitrack", mahasiswaRoutes);
app.use("/sitrack", koordinatorRoutes);
app.use("/sitrack", pembimbinginstansiRoutes);
app.use("/sitrack", dosenPembimbingRoutes);
app.use("/sitrack", dosenpengujiRoutes);
app.use("/sitrack", profileRoutes);
app.use("/sitrack", scheduleRoutes);
app.use('/uploads', express.static('C:/Indra/Web Project/SiTrack/Backend/uploads'));
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});