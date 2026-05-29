import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { take } from 'rxjs';

Chart.register(...registerables);

// ─── SCRUM-189 · Defaults globales BookMatch ───────────────────────────────
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(69,51,45,0.92)';
(Chart.defaults.plugins.tooltip as any).cornerRadius = 8;
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#6b4d39';

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

// ─── SCRUM-195 · Traffic Interfaces ────────────────────────────────────────
interface PageviewData {
  date: string;
  pageviews: number;
  activeUsers: number;
}
interface TopPageData {
  title: string;
  path: string;
  views: number;
}
interface VisitorData {
  country?: string;
  browser?: string;
  device?: string;
  users: number;
}
interface TrafficSummary {
  sessions: number;
  bounceRate: number;
  averageSessionDuration: number;
}
interface TrafficResponse {
  pageviewsByDay: PageviewData[];
  topPages: TopPageData[];
  visitorsByCountry: VisitorData[];
  browsers: VisitorData[];
  devices: VisitorData[];
  summary: TrafficSummary;
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
  correlationData: Correlation[] = [];

  pricesChart: Chart | null = null;
  reviewsChart: Chart | null = null;
  rfmChart: Chart | null = null;
  timeSeriesChart: Chart | null = null;
  monthlySalesChart: Chart | null = null;
  correlationChart: Chart | null = null;

  // ─── SCRUM-195 · Traffic State ─────────────────────────────────────────────
  loadingTraffic = true;
  trafficError: string | null = null;
  trafficData: TrafficResponse | null = null;

  pageviewsChart: Chart | null = null;
  countriesChart: Chart | null = null;
  browsersChart: Chart | null = null;

  // ─── SCRUM-189 · BookMatch Palette ─────────────────────────────────────────
  private colors = {
    walnut:       '#45332D',
    walnutLight:  '#6b4d39',
    walnutMid:    '#c88f4e',
    gold:         '#E0A15E',
    goldLight:    'rgba(224, 161, 94, 0.12)',
    cream:        '#FCF5E2',
    warmWhite:    '#fffaf0',
    doughnut:     ['#45332D', '#E0A15E', '#c88f4e', '#6b4d39', '#d4b896'],
    chartGrid:    'rgba(107, 77, 57, 0.08)'
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
          this.correlationData = data.category_correlation ?? [];

          // Se usa un timeout para asegurar que el DOM @else ha renderizado los canvas
          setTimeout(() => {
            this.renderPricesChart(data.pricesByCategory);
            this.renderReviewsChart(data.reviewsByCategory);
            this.renderRfmChart(data.rfm_segments);
            this.renderTimeSeriesChart(data.time_series);
            this.renderMonthlySalesChart(data.monthly_sales);
            this.renderCorrelationChart(data.category_correlation);
          }, 0);
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error en el servidor al cargar la analítica. (Comprueba los logs del backend).';
          console.error('Analytics error:', err);
        }
      });

      // ─── SCRUM-195 · Fetch Traffic Data ──────────────────────────────────────
      this.http.get<TrafficResponse>(`${this.API_URL}/analytics/traffic`, { headers }).subscribe({
        next: (data) => {
          this.loadingTraffic = false;
          this.trafficData = data;

          if (!this.isTrafficEmpty()) {
            setTimeout(() => {
              this.renderPageviewsChart(data.pageviewsByDay);
              this.renderCountriesChart(data.visitorsByCountry);
              this.renderBrowsersChart(data.browsers);
            }, 0);
          }
        },
        error: (err) => {
          this.loadingTraffic = false;
          this.trafficError = 'Error al cargar los datos de tráfico.';
          console.error('Traffic analytics error:', err);
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
            font: { family: "'Inter', sans-serif", size: 13 },
            color: this.colors.walnut,
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10
          }
        },
        tooltip: {
          backgroundColor: 'rgba(69,51,45,0.92)',
          cornerRadius: 8,
          padding: 12,
          titleFont: { size: 14, family: "'Inter', sans-serif", weight: 'bold' as const },
          bodyFont: { size: 13, family: "'Inter', sans-serif" },
          titleColor: this.colors.cream,
          bodyColor: '#d4b896'
        }
      }
    };
  }

  /** Helper: ejes estándar BookMatch */
  private getDefaultScales() {
    return {
      y: {
        beginAtZero: true,
        grid: { color: this.colors.chartGrid },
        border: { display: false },
        ticks: { color: this.colors.walnutLight, font: { size: 12 } }
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: this.colors.walnutLight, font: { size: 12 } }
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
          backgroundColor: this.colors.gold,   // #E0A15E — spec Jira
          borderRadius: 6,
          barPercentage: 0.65
        }]
      },
      options: {
        ...this.getDefaultChartOptions(),
        plugins: { ...this.getDefaultChartOptions().plugins, legend: { display: false } },
        scales: this.getDefaultScales()
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
          backgroundColor: this.colors.walnutMid,  // #c88f4e — spec Jira (barra horizontal)
          borderRadius: 6,
          barPercentage: 0.65
        }]
      },
      options: {
        ...this.getDefaultChartOptions(),
        indexAxis: 'y' as const,
        plugins: { ...this.getDefaultChartOptions().plugins, legend: { display: false } },
        scales: {
          x: {
            beginAtZero: true, max: 5,
            grid: { color: this.colors.chartGrid },
            border: { display: false },
            ticks: { stepSize: 1, color: this.colors.walnutLight, font: { size: 12 } }
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: this.colors.walnutLight, font: { size: 12 } }
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

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.segment),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: this.colors.doughnut as string[],
          borderWidth: 3,
          borderColor: this.colors.warmWhite,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right' as const,
            labels: {
              font: { family: "'Inter', sans-serif", size: 13 },
              color: this.colors.walnut,
              padding: 16,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(69,51,45,0.92)',
            cornerRadius: 8,
            padding: 12,
            titleFont: { size: 14, family: "'Inter', sans-serif", weight: 'bold' as const },
            bodyFont: { size: 13, family: "'Inter', sans-serif" },
            titleColor: this.colors.cream,
            bodyColor: '#d4b896'
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
            borderColor: this.colors.walnut,        // #45332D — spec Jira
            backgroundColor: this.colors.goldLight, // rgba(224,161,94,0.12) — spec Jira
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: this.colors.walnut
          },
          {
            label: 'Media Móvil 4s (€)',
            data: data.map(d => d.moving_avg_4w),
            borderColor: this.colors.gold,
            borderDash: [6, 4],
            fill: false,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0
          }
        ]
      },
      options: {
        ...this.getDefaultChartOptions(),
        interaction: { mode: 'index', intersect: false },
        scales: this.getDefaultScales()
      }
    };
    this.timeSeriesChart = new Chart(ctx, config);
  }

  renderMonthlySalesChart(data: any[]) {
    const ctx = document.getElementById('monthlySalesChart') as HTMLCanvasElement;
    if (!ctx || !data || data.length === 0) return;
    if (this.monthlySalesChart) this.monthlySalesChart.destroy();

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: data.map(d => d.month ?? d.period ?? d.label),
        datasets: [{
          label: 'Ventas Mensuales (€)',
          data: data.map(d => d.revenue ?? d.total ?? d.value),
          backgroundColor: this.colors.walnut,  // #45332D — spec Jira
          borderRadius: 6,
          barPercentage: 0.7
        }]
      },
      options: {
        ...this.getDefaultChartOptions(),
        plugins: { ...this.getDefaultChartOptions().plugins, legend: { display: false } },
        scales: this.getDefaultScales()
      }
    };
    this.monthlySalesChart = new Chart(ctx, config);
  }

  /** Convierte un valor de correlación (0-1) en un color de gradiente Cream → Gold → Walnut */
  correlationColor(value: number): string {
    // 0   → #fffaf0 (warmWhite)
    // 0.5 → #E0A15E (gold)
    // 1.0 → #45332D (walnut)
    const v = Math.max(0, Math.min(1, value));
    if (v <= 0.5) {
      // Interpolate warmWhite → gold
      const t = v * 2;
      const r = Math.round(255 + (224 - 255) * t);
      const g = Math.round(250 + (161 - 250) * t);
      const b = Math.round(240 + (94  - 240) * t);
      return `rgb(${r},${g},${b})`;
    } else {
      // Interpolate gold → walnut
      const t = (v - 0.5) * 2;
      const r = Math.round(224 + (69  - 224) * t);
      const g = Math.round(161 + (51  - 161) * t);
      const b = Math.round(94  + (45  - 94)  * t);
      return `rgb(${r},${g},${b})`;
    }
  }

  correlationTextColor(value: number): string {
    return value >= 0.55 ? '#FCF5E2' : '#45332D';
  }

  renderCorrelationChart(_data: Correlation[]) {
    // SCRUM-189: La correlación se renderiza como tabla HTML con gradiente de color.
    // No se usa Canvas — ver analytics.component.html #correlationTable
  }

  isTrafficEmpty(): boolean {
    if (!this.trafficData) return true;
    return this.trafficData.pageviewsByDay.length === 0;
  }

  // ─── SCRUM-195 · Traffic Charts ──────────────────────────────────────────

  renderPageviewsChart(data: PageviewData[]) {
    const ctx = document.getElementById('pageviewsChart') as HTMLCanvasElement;
    if (!ctx || !data || data.length === 0) return;
    if (this.pageviewsChart) this.pageviewsChart.destroy();

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: data.map(d => {
          // Format YYYYMMDD to DD/MM
          if (d.date.length === 8) {
            return `${d.date.substring(6,8)}/${d.date.substring(4,6)}`;
          }
          return d.date;
        }),
        datasets: [{
          label: 'Pageviews',
          data: data.map(d => d.pageviews),
          borderColor: this.colors.walnut,
          backgroundColor: this.colors.goldLight,
          borderWidth: 2,
          pointBackgroundColor: this.colors.gold,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        ...this.getDefaultChartOptions(),
        scales: this.getDefaultScales()
      }
    };
    this.pageviewsChart = new Chart(ctx, config);
  }

  renderCountriesChart(data: VisitorData[]) {
    const ctx = document.getElementById('countriesChart') as HTMLCanvasElement;
    if (!ctx || !data || data.length === 0) return;
    if (this.countriesChart) this.countriesChart.destroy();

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.country || 'Desconocido'),
        datasets: [{
          data: data.map(d => d.users),
          backgroundColor: this.colors.doughnut as string[],
          borderWidth: 2,
          borderColor: this.colors.warmWhite
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' as const },
          tooltip: this.getDefaultChartOptions().plugins.tooltip
        }
      }
    };
    this.countriesChart = new Chart(ctx, config);
  }

  renderBrowsersChart(data: VisitorData[]) {
    const ctx = document.getElementById('browsersChart') as HTMLCanvasElement;
    if (!ctx || !data || data.length === 0) return;
    if (this.browsersChart) this.browsersChart.destroy();

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.browser || 'Desconocido'),
        datasets: [{
          data: data.map(d => d.users),
          backgroundColor: ['#E0A15E', '#c88f4e', '#d4b896', '#eed0aa', '#f4ead0'],
          borderWidth: 2,
          borderColor: this.colors.warmWhite
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'right' as const },
          tooltip: this.getDefaultChartOptions().plugins.tooltip
        }
      }
    };
    this.browsersChart = new Chart(ctx, config);
  }
}
