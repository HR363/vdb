# Nearby Seller Social App - MVP Blueprint

## 1) Core Idea
A mobile-first social marketplace where sellers post products in an Instagram-like feed.
Each post includes seller location context so buyers can discover nearby products quickly.

## 2) Problem to Solve
- Local sellers struggle to get visibility without complex e-commerce setup.
- Buyers want fast discovery of nearby products and same-day pickup options.
- Posting should be simple, visual, and fast from phone.

## 3) MVP Goal
Launch a lightweight platform where:
1. Sellers can create visual product posts in under 60 seconds.
2. Buyers can browse a feed and filter by distance.
3. Every post shows approximate proximity to the viewer.

## 4) Main User Roles
- Seller: creates posts, sets price, stock status, location tag.
- Buyer: browses feed, checks distance, opens seller profile, messages seller.

## 5) Must-Have MVP Features

### A. Auth and Profiles
- Phone/email sign-in.
- Seller profile: display name, avatar, short bio, business category.
- Location permission flow with privacy explanation.

### B. Instagram-like Product Feed
- Vertical card feed optimized for mobile.
- Image-first cards with product title, price, seller name, location badge.
- Like and save (optional for MVP v1.1).

### C. Post Creation (Seller)
- Upload from device camera/gallery.
- Predefined image collage templates:
  - 1x1 single image
  - 2-grid
  - 3-grid (hero + 2 small)
  - 4-grid
- Seller can choose a template before publishing.
- Product fields:
  - Title
  - Price
  - Short description
  - Category
  - Quantity/status (In stock/Sold out)
  - Location tag (auto from GPS or manual area selection)

### D. Proximity and Discovery
- Show distance on each post (example: 1.2 km away).
- Sort/filter by nearest distance.
- Radius filters (1 km, 5 km, 10 km, 25 km).
- Neighborhood/city chips for quick browsing.

### E. Messaging (Basic)
- In-app buyer-to-seller chat for inquiry.
- Quick prompts: "Is this available?", "Can I pick up today?"
- Post-referenced message start: buyer can message directly from a post.
- First message includes a post preview card in chat so seller sees exactly which post was referenced.
- Persist post reference in the conversation thread (similar to story-reply context in Instagram).

## 6) Location and Privacy Rules
- Store precise coordinates securely but display approximate area publicly.
- Public card shows distance and area label, not full exact address by default.
- Allow seller to hide exact pin and only show "within X km".

## 7) Suggested UX Flow
1. New user opens app -> choose Buyer or Seller mode.
2. Seller onboarding -> profile + location permission.
3. Seller taps Create Post -> choose collage template -> add photos -> add product info -> publish.
4. Buyer feed loads posts ranked by recency + proximity.
5. Buyer opens a post -> sees distance + area -> taps Message Seller.
6. Chat opens with an attached post preview at the top of the message composer and in the sent message bubble.

## 8) Data Model (Simple)

### User
- id
- role (seller/buyer)
- name
- avatarUrl
- bio
- city
- geoPoint
- createdAt

### Post
- id
- sellerId
- mediaUrls[]
- collageType
- title
- description
- price
- category
- stockStatus
- geoPoint
- areaLabel
- createdAt

### Conversation
- id
- buyerId
- sellerId
- postId (optional; set when conversation starts from a specific post)
- updatedAt

### Message
- id
- conversationId
- senderId
- text
- referencedPostId (optional; identifies which post this message is about)
- referencedMediaIndex (optional; if user replied from a specific image in a collage)
- createdAt

## 8.1) Post-Referenced Messaging Rules
- If chat is started from a post, system auto-attaches that post as message context.
- Seller view must render: product thumbnail + title + price + area label in the message context card.
- Tapping the context card opens the original post detail.
- If the post is deleted or archived, keep a safe fallback label: "Original post unavailable".
- Buyer can still send normal messages without post context from seller profile.

## 9) Tech Stack Recommendation
- Frontend (mobile-first): React Native (Expo) or Flutter.
- Backend: Supabase or Firebase for rapid MVP.
- Database: Postgres (Supabase) or Firestore.
- Storage: cloud object storage for images.
- Geo queries: PostGIS (if Postgres) or geohash indexing (if Firestore).
- Auth: OTP phone + email fallback.

## 10) Post Ranking (MVP Logic)
Use a simple score:
score = recencyWeight + proximityWeight + engagementWeight
Start with:
- recencyWeight: high
- proximityWeight: medium-high
- engagementWeight: low (until enough data)

## 11) 4-Week MVP Roadmap

### Week 1
- Product scope freeze
- Wireframes for feed, post creation, profile
- DB schema + auth setup

### Week 2
- Seller flow: create post with collage templates + image upload
- Buyer feed list + post detail screen

### Week 3
- Proximity filters and distance display
- Basic chat and notifications

### Week 4
- QA on real devices
- Analytics events
- Soft launch to pilot sellers

## 12) Success Metrics
- Time-to-post (target < 60 seconds)
- Posts per seller per week
- Buyer-to-seller chat start rate
- Percentage of feed interactions on posts within 5 km
- Seller retention after 14 days

## 13) Risks and Mitigations
- Fake listings -> seller verification badges later.
- Privacy concerns -> approximate location by default.
- Poor feed quality -> category filters + moderation queue.
- Cold start -> seed with local pilot sellers and boosted onboarding.

## 14) Nice-to-Have After MVP
- Short video posts
- "Available now" badge
- Delivery/pickup options
- Payment integration
- Seller analytics dashboard
- AI-assisted auto-caption for post creation

## 15) Build-First Recommendation
Start with:
1. Seller onboarding
2. Post creation (with collage templates + device upload)
3. Nearby feed with distance filters
4. In-app chat
These four are enough to validate your core value quickly.
