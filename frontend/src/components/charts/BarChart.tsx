// Arquivo: frontend/src/components/charts/BarChart.tsx
"use client";

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js';
import { useEffect, useState } from 'react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartProps {
  chartData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
    }[];
  };
  title: string;
}

// Função para calcular o tamanho da fonte com base na largura da janela
const getResponsiveFontSize = () => {
  if (typeof window === 'undefined') {
    return { title: 18, legend: 14, ticks: 12 };
  }
  const width = window.innerWidth;
  if (width < 768) { // Telas pequenas (mobile)
    return { title: 14, legend: 10, ticks: 9 };
  }
  if (width < 1280) { // Telas médias (tablet/desktop pequeno)
    return { title: 16, legend: 12, ticks: 10 };
  }
  // Telas grandes
  return { title: 18, legend: 14, ticks: 12 };
};

export const BarChart = ({ chartData, title }: BarChartProps) => {
  const [fontSizes, setFontSizes] = useState(getResponsiveFontSize());

  useEffect(() => {
    const handleResize = () => {
      setFontSizes(getResponsiveFontSize());
    };

    window.addEventListener('resize', handleResize);
    // Limpa o evento quando o componente é desmontado para evitar vazamentos de memória
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false, // Permite que o gráfico se ajuste melhor verticalmente
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: fontSizes.legend, // Usa o tamanho da fonte responsivo
          }
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: fontSizes.title, // Usa o tamanho da fonte responsivo
        }
      },
    },
    scales: {
      y: {
        ticks: {
          color: '#8D96A0',
          font: {
            size: fontSizes.ticks, // Usa o tamanho da fonte responsivo
          }
        }
      },
      x: {
        ticks: {
          color: '#8D96A0',
          font: {
            size: fontSizes.ticks, // Usa o tamanho da fonte responsivo
          }
        }
      }
    }
  };

  return (
    <div style={{ position: 'relative', height: '400px' }}>
        <Bar options={options} data={chartData} />
    </div>
  );
};