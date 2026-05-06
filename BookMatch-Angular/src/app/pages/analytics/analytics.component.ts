import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { take } from 'rxjs';

Chart.register(...registerables);

interface PriceData {
  category: string;
  average_price: number;
}

interface ReviewData {
  category: string;
  average_rating: number;
}

interface GlobalKPIs {
  total_revenue: number;
  total_orders: number;
  total_users: number;
  average_ticket: number;
  average_rating: number;
}

interface TopBook {
  title: string;
  quantity: number;
}

interface RFMSegment {
  segment: string;
  count: number;
}

interface TimeSeries {
  week: string;
  revenue: number;
  moving_avg_4w: number;
  growth_pct: number;
}

interface Correlation {
  cat_a: string;
  cat_b: string;
  correlation: number;
}

interface AnalyticsResponse {
  global_kpis: GlobalKPIs;
  rfm_segments: RFMSegment[];
  time_series: TimeSeries[];
  monthly_sales: any[];
  top_books: TopBook[];
  category_correlation: Correlation[];
  pricesByCategory: PriceData[];
  reviewsByCategory: ReviewData[];
}

import { CountUpDirective } from '../../shared/directives/count-up.directive';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, CountUpDirective],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly API_URL = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;

  loading = true;
  error: string | null = null;
  
  globalKpis: GlobalKPIs | null = null;
  topBooks: TopBook[] = [];

  pricesChart: Chart | null = null;
  reviewsChart: Chart | null = null;
  rfmChart: Chart | null = null;
  timeSeriesChart: Chart | null = null;
  correlationChart: Chart | null = null;

  // BookMatch Palette
  private colors = {
    walnut: '#45332D',
    walnutLight: '#6b4d39',
    gold: '#E0A15E',
    cream: '#FCF5E2',
    teal: '#3E7D7A', // Añadido para dar variedad a gráficos
    coral: '#D96C5C', // Añadido para dar variedad a gráficos
    chartGrid: 'rgba(107, 77, 57, 0.08)'
  };

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.authService.getToken().pipe(take(1)).subscribe((token) => {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      
      this.http.get<AnalyticsResponse>(`${this.API_URL}/analytics/dashboard`, { headers }).subscribe({
        next: (data) => {
          this.loading = false;
          this.globalKpis = data.global_kpis;
          this.topBooks = data.top_books;

          // Se usa un timeout para asegurar que el DOM @else ha renderizado los canvas
          setTimeout(() => {
            this.renderPricesChart(data.pricesByCategory);
            this.renderReviewsChart(data.reviewsByCategory);
            this.renderRfmChart(data.rfm_segments);
            this.renderTimeSeriesChart(data.time_series);
            this.renderCorrelationChart(data.category_correlation);
          }, 0);
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error en el servidor al cargar la analítica. (Comprueba los logs del backend).';
          console.error('Analytics error:', err);
        }
      });
    });
  }

  private getDefaultChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            font: { family: "'Inter', sans-serif" },
            color: this.colors.walnut
          }
        },
        tooltip: {
          backgroundColor: 'rgba(69, 51, 45, 0.95)', // dark walnut
          padding: 12,
          titleFont: { size: 14, family: "'Inter', sans-serif" },
          bodyFont: { size: 13, family: "'Inter', sans-serif" }
        }
      }
    };
  }

  renderPricesChart(data: PriceData[]) {
    const ctx = document.getElementById('pricesChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.pricesChart) this.pricesChart.destroy();

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: data.map(d => d.category),
        datasets: [{
          label: 'Precio Medio (€)',
          data: data.map(d => d.average_price),
          backgroundColor: this.colors.teal,
          borderRadius: 6,
          barPercentage: 0.6
        }]
      },
      options: {
        ...this.getDefaultChartOptions(),
        plugins: {
          ...this.getDefaultChartOptions().plugins,
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: this.colors.chartGrid },
            border: { display: false },
            ticks: { color: this.colors.walnutLight }
          },
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: this.colors.walnutLight }
          }
        }
      }
    };
    this.pricesChart = new Chart(ctx, config);
  }

  renderReviewsChart(data: ReviewData[]) {
    const ctx = document.getElementById('reviewsChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.reviewsChart) this.reviewsChart.destroy();

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: data.map(d => d.category),
        datasets: [{
          label: 'Valoración Media (★)',
          data: data.map(d => d.average_rating),
          backgroundColor: this.colors.gold,
          borderRadius: 6,
          barPercentage: 0.6
        }]
      },
      options: {
        ...this.getDefaultChartOptions(),
        plugins: {
          ...this.getDefaultChartOptions().plugins,
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            grid: { color: this.colors.chartGrid },
            border: { display: false },
            ticks: { stepSize: 1, color: this.colors.walnutLight }
          },
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: this.colors.walnutLight }
          }
        }
      }
    };
    this.reviewsChart = new Chart(ctx, config);
  }

  renderRfmChart(data: RFMSegment[]) {
    const ctx = document.getElementById('rfmChart') as HTMLCanvasElement;
    if (!ctx || !data || data.length === 0) return;
    if (this.rfmChart) this.rfmChart.destroy();

    const bgColors = [
      this.colors.gold,
      this.colors.teal,
      this.colors.coral,
      this.colors.walnutLight,
      this.colors.walnut
    ];

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.segment),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: this.colors.cream
        }]
      },
      options: {
        ...this.getDefaultChartOptions(),
        cutout: '65%',
        plugins: {
          ...this.getDefaultChartOptions().plugins,
          legend: {
            position: 'right' as const,
            labels: { font: { family: "'Inter', sans-serif" }, color: this.colors.walnut }
          }
        }
      }
    };
    this.rfmChart = new Chart(ctx, config);
  }

  renderTimeSeriesChart(data: TimeSeries[]) {
    const ctx = document.getElementById('timeSeriesChart') as HTMLCanvasElement;
    if (!ctx || !data || data.length === 0) return;
    if (this.timeSeriesChart) this.timeSeriesChart.destroy();

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.map(d => d.week),
        datasets: [
          {
            label: 'Ingresos Semanales (€)',
            data: data.map(d => d.revenue),
            borderColor: this.colors.teal,
            backgroundColor: 'rgba(62, 125, 122, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3
          },
          {
            label: 'Media Móvil 4s (€)',
            data: data.map(d => d.moving_avg_4w),
            borderColor: this.colors.coral,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0
          }
        ]
      },
      options: {
        ...this.getDefaultChartOptions(),
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: this.colors.chartGrid },
            border: { display: false },
            ticks: { color: this.colors.walnutLight }
          },
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: this.colors.walnutLight }
          }
        }
      }
    };
    this.timeSeriesChart = new Chart(ctx, config);
  }

  renderCorrelationChart(data: Correlation[]) {
    const ctx = document.getElementById('correlationChart') as HTMLCanvasElement;
    if (!ctx || !data || data.length === 0) return;
    if (this.correlationChart) this.correlationChart.destroy();

    // Prepare labels combining cat_a and cat_b
    const labels = data.map(d => `${d.cat_a} + ${d.cat_b}`);
    const values = data.map(d => d.correlation);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Fuerza de Correlación (Pearson)',
          data: values,
          backgroundColor: this.colors.gold,
          borderRadius: 4,
          barPercentage: 0.8
        }]
      },
      options: {
        ...this.getDefaultChartOptions(),
        indexAxis: 'y' as const, // Horizontal Bar Chart
        plugins: {
          ...this.getDefaultChartOptions().plugins,
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 1.0,
            grid: { color: this.colors.chartGrid },
            border: { display: false },
            ticks: { color: this.colors.walnutLight }
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: this.colors.walnutLight, font: { size: 11 } }
          }
        }
      }
    };
    this.correlationChart = new Chart(ctx, config);
  }
}
