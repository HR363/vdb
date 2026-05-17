import { Routes } from '@angular/router';
import { FeedComponent } from '../pages/feed/feed.component';
import { SellerOnboardingComponent } from '../pages/seller-onboarding/seller-onboarding.component';
import { CreatePostComponent } from '../pages/create-post/create-post.component';
import { MessagesComponent } from '../pages/messages/messages.component';
import { AuthComponent } from '../pages/auth/auth.component';
import { SellerProfileComponent } from '../pages/seller-profile/seller-profile.component';
import { BuyerProfileComponent } from '../pages/buyer-profile/buyer-profile.component';

export const routes: Routes = [
	{ path: '', component: FeedComponent },
	{ path: 'auth', component: AuthComponent },
	{ path: 'seller-onboarding', component: SellerOnboardingComponent },
	{ path: 'create-post', component: CreatePostComponent },
	{ path: 'messages', component: MessagesComponent },
	{ path: 'seller-profile', component: SellerProfileComponent },
	{ path: 'buyer-profile', component: BuyerProfileComponent },
];
