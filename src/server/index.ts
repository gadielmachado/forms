import express from "express";
import cors from "cors";
import emailRoutes from "./routes/emailRoutes";

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true
}));

// Registrar rotas
app.use("/api/email", emailRoutes);

// Rota de teste básica
app.get("/", (req, res) => {
  res.send("API do Ephesus.App funcionando!");
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 