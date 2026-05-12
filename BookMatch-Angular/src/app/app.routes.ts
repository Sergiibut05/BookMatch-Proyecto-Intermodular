import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

/**
 * Declaracion central de rutas de la aplicacion.
 *
 * Organiza el flujo principal de autenticacion, catalogo, perfil, foro y
 * secciones legales, aplicando `authGuard` en todas las vistas privadas.
 */
export const routes: Routes = [
    {
        path: '',
        redirectTo: '/auth/login',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        children: [
          {
            path: 'login',
            loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
          },
          {
            path: 'register',
            loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
          }
        ]
      },
      {
        path: 'home',
        canActivate: [authGuard],
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'trueque',
        canActivate: [authGuard],
        loadComponent: () => import('./features/trueque/trueque.component').then(m => m.TruequeComponent)
      },
      {
        path: 'admin/books/create',
        canActivate: [authGuard],
        loadComponent: () => import('./features/book-form/book-form').then(m => m.BookFormComponent)
      },
      {
        path: 'admin/books/edit/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/book-form/book-form').then(m => m.BookFormComponent)
      },
      {
        path: 'categories',
        canActivate: [authGuard],
        loadComponent: () => import('./features/categories-selector/categories-selector').then(m => m.CategoriesSelector)
      },
      {
        path: 'categories/:categoria',
        canActivate: [authGuard], 
        loadComponent: () => import('./features/categories/categories').then(m => m.Categories)
      },
      {
        path: 'book-details/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/book-details/book-details').then(m => m.BookDetails)
      },
      {
        path: 'cart',
        canActivate: [authGuard],
        loadComponent: () => import('./features/cart-view/cart-view.component').then(m => m.CartViewComponent)
      },
      {
        path: 'payment-success',
        canActivate: [authGuard],
        loadComponent: () => import('./features/payment.success/payment.success.component').then(m => m.PaymentSuccessComponent)
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./features/profile/profile').then(m => m.Profile)
      },
      {
        path: 'foro',
        canActivate: [authGuard],
        loadComponent: () => import('./features/forum-index/forum-index.component').then(m => m.ForumIndexComponent)
      },
      {
        path: 'foro/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/forum-topic-list/forum-topic-list.component').then(m => m.ForumTopicListComponent)
      },
      {
        path: 'foro/:forumId/tema/:postId',
        canActivate: [authGuard],
        loadComponent: () => import('./features/post-detail/post-detail.component').then(m => m.PostDetailComponent)
      },
      {
        path: 'search-results',
        canActivate: [authGuard],
        loadComponent: () => import('./features/search-results/search-results.component').then(m => m.SearchResultsComponent)
      },
      {
        path: 'privacy-policy',
        loadComponent: () => import('./features/footer/privacy-policy/privacy-policy').then(m => m.PrivacyPolicy)
      },
      {
        path: 'cookies-policy',
        loadComponent: () => import('./features/footer/cookies-policy/cookies-policy').then(m => m.CookiesPolicy)
      },
      {
        path: 'refund-policy',
        loadComponent: () => import('./features/footer/refund-policy/refund-policy').then(m => m.RefundPolicy)
      },
      {
        path: 'terms-and-conditions',
        loadComponent: () => import('./features/footer/terms-and-conditions/terms-and-conditions').then(m => m.TermsAndConditions)
      },
      {
        path: 'frequent-questions',
        loadComponent: () => import('./features/footer/frequent-questions/frequent-questions').then(m => m.FrequentQuestions)
      },
      {
        path: 'payment-methods',
        loadComponent: () => import('./features/footer/payment-methods/payment-methods').then(m => m.PaymentMethods)
      },
      {
        path: 'about-us',
        loadComponent: () => import('./features/footer/about-us/about-us').then(m => m.AboutUs)
      },
      {
        path: 'ai-chat',
        canActivate: [authGuard],
        loadComponent: () => import('./features/ai-chat/ai-chat.component').then(m => m.AiChatComponent)
      },
      {
        path: 'playlists',
        canActivate: [authGuard],
        loadComponent: () => import('./features/playlists/playlists-list.component').then(m => m.PlaylistsListComponent)
      },
      {
        path: 'playlists/new',
        canActivate: [authGuard],
        loadComponent: () => import('./features/playlists/playlist-new.component').then(m => m.PlaylistNewComponent)
      },
      {
        path: 'playlists/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/playlists/playlist-detail.component').then(m => m.PlaylistDetailComponent)
      },
      {
        // Vista pública de una playlist compartida. SIN authGuard.
        path: 'public/playlists/:token',
        loadComponent: () => import('./features/playlists/playlist-public.component').then(m => m.PlaylistPublicComponent)
      },
      {
        path: 'analytics',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/analytics/analytics.component').then(m => m.AnalyticsComponent)
      },
      {
        path: '**',
        redirectTo: '/auth/login'
      }
];
