import express from "express";
import { generateDocument } from "../services/openaiService";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import aiRoutes from "./routes/aiRoutes";

dotenv.config();

const router = express.Router();

// Inicializar cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL || "https://sua-url-do-supabase.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "sua-chave-do-supabase";
const supabase = createClient(supabaseUrl, supabaseKey);

router.post("/generate", async (req, res) => {
  try {
    const { formId, action } = req.body;
    
    if (!formId || !action) {
      return res.status(400).json({
        success: false,
        message: "Parâmetros obrigatórios faltando: formId ou action"
      });
    }
    
    console.log(`Processando solicitação: ${action} para formulário ${formId}`);
    
    // Buscar dados do formulário
    const { data: formData, error: formError } = await supabase
      .from("forms")
      .select("*")
      .eq("id", formId)
      .single();
      
    if (formError) {
      console.error("Erro ao buscar formulário:", formError);
      return res.status(404).json({
        success: false,
        message: "Formulário não encontrado",
        error: formError.message
      });
    }
    
    // Buscar respostas do formulário
    const { data: responsesData, error: responsesError } = await supabase
      .from("form_responses")
      .select("response_data")
      .eq("form_id", formId)
      .order("created_at", { ascending: false })
      .limit(1);
      
    if (responsesError) {
      console.error("Erro ao buscar respostas:", responsesError);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar respostas do formulário",
        error: responsesError.message
      });
    }
    
    // Preparar dados completos para geração
    const formDataWithResponses = {
      ...formData,
      responses: responsesData.length > 0 ? responsesData[0].response_data : {}
    };
    
    // Gerar documento com OpenAI
    const generatedText = await generateDocument(formDataWithResponses, action);
    
    // Retornar o texto gerado
    return res.status(200).json({
      success: true,
      generatedText,
      action,
      formName: formData.name
    });
    
  } catch (error) {
    console.error("Erro ao processar solicitação:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Erro interno ao gerar documento",
      error: error
    });
  }
});

export default router; 