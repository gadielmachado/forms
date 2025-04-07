import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Definição do tipo de tema
export interface ThemeColors {
  primary: string;
  button: string;
  accent: string;
  text: string;
  border: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  mode: 'dark' | 'light'; // Adicionado suporte para modo claro/escuro
}

// Tema padrão (azul escuro)
export const defaultTheme: Theme = {
  id: "azul-padrao",
  name: "Azul Padrão",
  mode: 'dark',
  colors: {
    primary: "from-indigo-600 to-indigo-800",
    button: "bg-indigo-600 hover:bg-indigo-700",
    accent: "bg-indigo-500",
    text: "text-indigo-500",
    border: "border-indigo-600",
  },
};

// Lista de temas disponíveis
export const availableThemes: Theme[] = [
  defaultTheme,
  {
    id: "verde-natureza",
    name: "Verde Natureza",
    mode: 'dark',
    colors: {
      primary: "from-emerald-600 to-emerald-800",
      button: "bg-emerald-600 hover:bg-emerald-700",
      accent: "bg-emerald-500",
      text: "text-emerald-500",
      border: "border-emerald-600",
    },
  },
  {
    id: "roxo-criativo",
    name: "Roxo Criativo",
    mode: 'dark',
    colors: {
      primary: "from-purple-600 to-purple-800",
      button: "bg-purple-600 hover:bg-purple-700",
      accent: "bg-purple-500",
      text: "text-purple-500",
      border: "border-purple-600",
    },
  },
  {
    id: "vermelho-energia",
    name: "Vermelho Energia",
    mode: 'dark',
    colors: {
      primary: "from-red-600 to-red-800",
      button: "bg-red-600 hover:bg-red-700",
      accent: "bg-red-500",
      text: "text-red-500",
      border: "border-red-600",
    },
  },
  {
    id: "laranja-criativo",
    name: "Laranja Criativo",
    mode: 'dark',
    colors: {
      primary: "from-orange-500 to-orange-700",
      button: "bg-orange-600 hover:bg-orange-700",
      accent: "bg-orange-500",
      text: "text-orange-500",
      border: "border-orange-600",
    },
  },
  {
    id: "cinza-profissional",
    name: "Cinza Profissional",
    mode: 'dark',
    colors: {
      primary: "from-gray-600 to-gray-800",
      button: "bg-gray-600 hover:bg-gray-700",
      accent: "bg-gray-500",
      text: "text-gray-500",
      border: "border-gray-600",
    },
  },
];

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => Promise<void>;
  isLoading: boolean;
  toggleMode: (mode: 'dark' | 'light') => Promise<void>; // Nova função para alternar o modo
}

// Criar uma chave para armazenar o tema no localStorage para rápido acesso
const THEME_STORAGE_KEY = 'soren-forms-theme';
const THEME_MODE_KEY = 'soren-forms-mode'; // Nova chave para o modo (claro/escuro)

// Criação do contexto
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Hook para usar o contexto
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

// Função auxiliar para obter um tema pelo ID
const getThemeById = (themeId: string): Theme => {
  const theme = availableThemes.find(t => t.id === themeId);
  return theme || defaultTheme;
};

// Componente Provider
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar tema das configurações ao iniciar
  useEffect(() => {
    const loadTheme = async () => {
      try {
        setIsLoading(true);

        // Primeiro tentamos carregar do localStorage para melhor performance
        const cachedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
        const cachedMode = localStorage.getItem(THEME_MODE_KEY) as 'dark' | 'light' || 'dark';
        
        if (cachedThemeId) {
          const theme = getThemeById(cachedThemeId);
          
          // Aplicar o modo salvo
          theme.mode = cachedMode;
          
          setCurrentTheme(theme);
          console.log("✅ Tema carregado do cache:", theme.name, "Modo:", theme.mode);
          setIsLoading(false);
          return;
        }
        
        // Buscar tema das configurações (assumindo que existe uma tabela "settings")
        const { data, error } = await supabase
          .from('settings')
          .select('theme_id, theme_mode')
          .eq('id', 1)
          .single();
        
        if (error) {
          console.error('Erro ao carregar tema do Supabase:', error);
          // Se não conseguir carregar do Supabase, usamos o tema padrão
          setIsLoading(false);
          return;
        }
        
        // Se tiver um tema salvo, usar ele
        if (data && data.theme_id) {
          const theme = getThemeById(data.theme_id);
          
          // Aplicar o modo salvo se existir
          if (data.theme_mode) {
            theme.mode = data.theme_mode;
          }
          
          setCurrentTheme(theme);
          
          // Salvar no localStorage para acesso mais rápido próxima vez
          localStorage.setItem(THEME_STORAGE_KEY, theme.id);
          localStorage.setItem(THEME_MODE_KEY, theme.mode);
          
          console.log("✅ Tema carregado do banco de dados:", theme.name, "Modo:", theme.mode);
        }
      } catch (error) {
        console.error('Erro ao carregar tema:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTheme();
  }, []);

  // Função para atualizar o tema
  const setTheme = async (themeId: string) => {
    try {
      setIsLoading(true);
      
      // Encontrar o tema na lista de temas disponíveis
      const theme = getThemeById(themeId);
      
      // Manter o modo atual ao trocar o tema
      const currentMode = currentTheme.mode;
      theme.mode = currentMode;
      
      // Atualizar o tema no estado
      setCurrentTheme(theme);
      
      // Salvar no localStorage primeiro (para performance)
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
      localStorage.setItem(THEME_MODE_KEY, theme.mode);
      
      // Salvar no Supabase
      const { error } = await supabase
        .from('settings')
        .update({ 
          theme_id: themeId,
          theme_mode: theme.mode
        })
        .eq('id', 1);
        
      if (error) {
        console.error('Erro ao salvar tema no Supabase:', error);
        // Mesmo com erro no Supabase, mantemos o tema no localStorage e no estado
      } else {
        console.log("✅ Tema salvo com sucesso:", theme.name, "Modo:", theme.mode);
      }
        
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Nova função para alternar entre modos claro e escuro
  const toggleMode = async (mode: 'dark' | 'light') => {
    try {
      setIsLoading(true);
      
      // Criar uma cópia do tema atual
      const updatedTheme = { ...currentTheme, mode };
      
      // Atualizar o tema no estado
      setCurrentTheme(updatedTheme);
      
      // Salvar no localStorage
      localStorage.setItem(THEME_MODE_KEY, mode);
      
      // Salvar no Supabase
      const { error } = await supabase
        .from('settings')
        .update({ theme_mode: mode })
        .eq('id', 1);
        
      if (error) {
        console.error('Erro ao salvar modo no Supabase:', error);
      } else {
        console.log(`✅ Modo ${mode} salvo com sucesso`);
      }
        
    } catch (error) {
      console.error('Erro ao alternar modo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, isLoading, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}; 