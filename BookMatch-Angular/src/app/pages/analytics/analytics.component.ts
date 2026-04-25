import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
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

interface AnalyticsResponse {
  pricesByCategory: PriceData[];
  reviewsByCategory: ReviewData[];
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './analytics.component.html'
})
export class AnalyticsComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly API_URL = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;

  loading = true;
  error: string | null = null;
  pricesChart: Chart | null = null;
  reviewsChart: Chart | null = null;

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.authService.getToken().pipe(take(1)).subscribe((token) => {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      
      this.http.get<AnalyticsResponse>(`${this.API_URL}/analytics/inventory`, { headers }).subscribe({
        next: (data) => {
          this.loading = false;
          // Se usa un timeout para asegurar que el DOM @else ha renderizado los canvas
          setTimeout(() => {
            this.renderPricesChart(data.pricesByCategory);
            this.renderReviewsChart(data.reviewsByCategory);
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

  renderPricesChart(data: PriceData[]) {
    const ctx = document.getElementById('pricesChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.pricesChart) {
      this.pricesChart.destroy();
    }

    const labels = data.map(d => d.category);
    const values = data.map(d => d.average_price);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Precio Medio (€)',
          data: values,
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderColor: 'rgb(79, 70, 229)',
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            padding: 12,
            titleFont: { size: 14, family: "'Inter', sans-serif" },
            bodyFont: { size: 13, family: "'Inter', sans-serif" },
            callbacks: {
              label: (context) => ` ${context.raw} €`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(243, 244, 246, 1)' },
            border: { display: false }
          },
          x: {
            grid: { display: false },
            border: { display: false }
          }
        }
      }
    };

    this.pricesChart = new Chart(ctx, config);
  }

  renderReviewsChart(data: ReviewData[]) {
    const ctx = document.getElementById('reviewsChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.reviewsChart) {
      this.reviewsChart.destroy();
    }

    const labels = data.map(d => d.category);
    const values = data.map(d => d.average_rating);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Valoración Media (estrellas)',
          data: values,
          backgroundColor: 'rgba(250, 204, 21, 0.7)',
          borderColor: 'rgb(234, 179, 8)',
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            padding: 12,
            titleFont: { size: 14, family: "'Inter', sans-serif" },
            bodyFont: { size: 13, family: "'Inter', sans-serif" },
            callbacks: {
              label: (context) => ` ${context.raw} ★`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            grid: { color: 'rgba(243, 244, 246, 1)' },
            border: { display: false },
            ticks: { stepSize: 1 }
          },
          x: {
            grid: { display: false },
            border: { display: false }
          }
        }
      }
    };

    this.reviewsChart = new Chart(ctx, config);
  }
}
