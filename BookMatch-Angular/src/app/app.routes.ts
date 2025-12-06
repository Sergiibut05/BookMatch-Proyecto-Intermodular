import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
        path: '**',
        redirectTo: '/auth/login'
      }
];
