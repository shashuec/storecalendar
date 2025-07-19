# 30-Day Technical Development Plan: StoreCalendar E-commerce Content Platform
## Auto-Posting + AI Visual Content + Revenue Attribution

**Mission**: Transform V1 into comprehensive e-commerce content platform with auto-posting and revenue tracking
**Market Position**: Starting with Shopify, expanding to all e-commerce platforms
**Pricing Strategy**: $29 early access, $39 regular pricing after first 100 customers
**Tech Goal**: 4 core features built on solid V1 foundation
**Shipping**: 5 major releases over 30 days
**Code Estimate**: 15,000-20,000 lines of quality code

---

## 🏗️ **BUILDING ON SOLID V1 FOUNDATION**

### **✅ What We Already Have (COMPLETE)**
- Complete Shopify URL input and product scraping (50 products)
- Holiday-aware calendar generation (101 holidays, 3 countries)
- Smart product ranking and selection algorithms
- 4 comprehensive brand tones with AI integration
- Interactive UI components (CountrySelector, ProductSelector, WeeklyCalendar)
- Week 1 → Week 2 progression system
- CSV export functionality
- Complete API endpoint (`/api/generate`)
- Comprehensive testing suite
- TypeScript throughout, Supabase database, rate limiting
- **Ready for Multi-Platform Expansion**: Architecture supports extending beyond Shopify

### **🎯 What We're Adding (5 Core Features)**
1. **Auto-Posting Integration** (Instagram Business + LinkedIn)
2. **AI Image Generation** (DALL-E 3 with brand consistency)
3. **AI Video Generation** (Product slideshows with music)
4. **Revenue Attribution** (UTM tracking + Shopify webhooks)
5. **Multi-Platform Foundation** (WooCommerce waitlist, platform-agnostic messaging)

### **📈 Market Strategy & Messaging**
- **Positioning**: "E-commerce content platform" (not "Shopify tool")
- **Early Access Pricing**: $29/month for first 100 customers (lifetime rate)
- **Regular Pricing**: $39/month after early access period
- **Platform Messaging**: "Starting with Shopify, expanding to all e-commerce platforms"
- **Waitlist Strategy**: Collect WooCommerce/BigCommerce emails for Month 2 validation

### **🗣️ Updated Messaging Framework**
**Instead of**: "StoreCalendar for Shopify stores"
**Say**: "StoreCalendar for e-commerce stores (starting with Shopify)"

**Key Phrases**:
- "Currently supports Shopify, WooCommerce coming soon"
- "Built for e-commerce, not just Shopify"
- "Join waitlist for your platform"
- "Early access pricing: $29/month"

---

## 📅 **WEEK 1: AUTO-POSTING FOUNDATION (Days 1-7)**
**Goal**: Add auto-posting capability to existing V1 calendar system
**Ship**: Release 1 (Day 4) - Auto-posting launch

### **DAY 1: Auto-Posting Infrastructure Setup**
**Goal**: Choose posting service and set up social media app registrations

#### **Morning Tasks (4 hours)**
- [ ] **Research Posting Services**
  - Evaluate Buffer API vs Postiz vs Direct APIs
  - Compare costs, reliability, and feature sets
  - **Decision**: Buffer API recommended for MVP (proven reliability)
- [ ] **Social Media App Setup**
  - Register Instagram Business API application
  - Register LinkedIn API application
  - Set up OAuth redirect URLs and app permissions
- [ ] **Database Schema Design**
  ```sql
  CREATE TABLE calendar_social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    platform VARCHAR(50) NOT NULL,
    platform_user_id VARCHAR(255),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    account_info JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  
  CREATE TABLE calendar_posting_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_post_id UUID,
    social_account_id UUID REFERENCES calendar_social_accounts(id),
    platform VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    image_urls TEXT[],
    video_url TEXT,
    scheduled_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    posted_at TIMESTAMP,
    platform_post_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

#### **Afternoon Tasks (4 hours)**
- [ ] **Buffer API Integration Setup**
  - Install Buffer API SDK or create custom HTTP client
  - Set up API credentials in environment variables
  - Create basic Buffer service class structure
- [ ] **OAuth Flow Foundation**
  - Create OAuth routes for Instagram and LinkedIn
  - Build OAuth state management for security
  - Design social account connection UI components

#### **Evening Tasks (2 hours)**
- [ ] **Testing & Documentation**
  - Test social media app registrations
  - Document API credentials setup process
  - Create development environment configuration

**Deliverable**: Social media apps registered, Buffer API integrated, OAuth foundation ready

### **DAY 2: OAuth Implementation & Account Connections**
**Goal**: Complete social media account connection system

#### **Morning Tasks (4 hours)**
- [ ] **Instagram Business OAuth**
  ```typescript
  // /src/lib/oauth/instagram.ts
  export class InstagramOAuth {
    private clientId: string;
    private clientSecret: string;
    
    async getAuthUrl(state: string): Promise<string> {
      // Generate Instagram OAuth URL with proper scopes
    }
    
    async exchangeCodeForToken(code: string): Promise<TokenResponse> {
      // Exchange authorization code for access token
    }
    
    async refreshToken(refreshToken: string): Promise<TokenResponse> {
      // Refresh expired access token
    }
  }
  ```
- [ ] **LinkedIn OAuth Implementation**
  ```typescript
  // /src/lib/oauth/linkedin.ts
  export class LinkedInOAuth {
    async getAuthUrl(state: string): Promise<string> {
      // Generate LinkedIn OAuth URL with proper scopes
    }
    
    async exchangeCodeForToken(code: string): Promise<TokenResponse> {
      // Exchange authorization code for access token
    }
  }
  ```

#### **Afternoon Tasks (4 hours)**
- [ ] **OAuth API Routes**
  ```typescript
  // /src/app/api/oauth/instagram/route.ts
  export async function GET(request: Request) {
    // Handle Instagram OAuth callback
    // Exchange code for token
    // Save account to database
    // Redirect to success page
  }
  
  // /src/app/api/oauth/linkedin/route.ts
  export async function GET(request: Request) {
    // Handle LinkedIn OAuth callback
  }
  ```
- [ ] **Database Operations**
  ```typescript
  // /src/lib/social-accounts.ts
  export async function saveSocialAccount(userId: string, accountData: SocialAccount) {
    // Save social account to database
  }
  
  export async function getSocialAccounts(userId: string) {
    // Retrieve user's connected social accounts
  }
  
  export async function refreshExpiredTokens() {
    // Background job to refresh expired tokens
  }
  ```

#### **Evening Tasks (2 hours)**
- [ ] **UI Components**
  ```typescript
  // /src/components/SocialAccountsManager.tsx
  export function SocialAccountsManager() {
    // Display connected accounts
    // Show connection buttons for Instagram/LinkedIn
    // Handle account disconnection
  }
  ```

**Deliverable**: Complete OAuth flow working for Instagram and LinkedIn

### **DAY 3: Posting Queue & Scheduling System**
**Goal**: Build posting queue management and scheduling

#### **Morning Tasks (4 hours)**
- [ ] **Posting Queue Service**
  ```typescript
  // /src/lib/posting-queue.ts
  export class PostingQueueService {
    async schedulePost(params: {
      socialAccountId: string;
      content: string;
      imageUrls?: string[];
      scheduledTime: Date;
      calendarPostId?: string;
    }): Promise<string> {
      // Add post to queue with proper scheduling
    }
    
    async processQueue(): Promise<void> {
      // Process pending posts that are ready to be published
    }
    
    async cancelScheduledPost(queueId: string): Promise<void> {
      // Cancel a scheduled post
    }
    
    async getQueueStatus(userId: string): Promise<QueuedPost[]> {
      // Get user's queued posts
    }
  }
  ```
- [ ] **Buffer API Integration**
  ```typescript
  // /src/lib/posting/buffer-client.ts
  export class BufferClient {
    async createPost(params: {
      profileId: string;
      text: string;
      media?: string[];
      scheduledAt?: Date;
    }): Promise<BufferPost> {
      // Create post via Buffer API
    }
    
    async getProfiles(accessToken: string): Promise<BufferProfile[]> {
      // Get user's Buffer profiles
    }
  }
  ```

#### **Afternoon Tasks (4 hours)**
- [ ] **Scheduling Logic**
  ```typescript
  // /src/lib/posting/scheduler.ts
  export class PostingScheduler {
    async getOptimalPostingTimes(timezone: string): Promise<Date[]> {
      // Return optimal posting times based on platform best practices
    }
    
    async scheduleCalendarPosts(params: {
      calendarPosts: CalendarPost[];
      socialAccounts: SocialAccount[];
      startDate: Date;
    }): Promise<QueuedPost[]> {
      // Schedule all calendar posts with optimal timing
    }
  }
  ```
- [ ] **Queue Processing Worker**
  ```typescript
  // /src/lib/posting/queue-processor.ts
  export class QueueProcessor {
    async processScheduledPosts(): Promise<void> {
      // Find posts ready to be published
      // Publish via appropriate API
      // Update status in database
      // Handle errors and retries
    }
  }
  ```

#### **Evening Tasks (2 hours)**
- [ ] **Error Handling & Retries**
  - Implement exponential backoff for failed posts
  - Add error logging and notification system
  - Create retry mechanism for temporary failures

**Deliverable**: Complete posting queue system with scheduling

### **DAY 4: Calendar Integration & UI Enhancement**
**Goal**: Integrate auto-posting with existing WeeklyCalendar component

#### **Morning Tasks (4 hours)**
- [ ] **WeeklyCalendar Enhancement**
  ```typescript
  // Update /src/components/WeeklyCalendar.tsx
  export function WeeklyCalendar({ weeklyCalendar }: WeeklyCalendarProps) {
    return (
      <div className="space-y-6">
        {weeklyCalendar.days.map((day) => (
          <div key={day.day} className="border rounded-lg p-4">
            <h3>{day.day}</h3>
            <p>{day.content}</p>
            
            {/* NEW: Auto-posting controls */}
            <div className="mt-4 flex gap-2">
              <PostingControls 
                content={day.content}
                calendarPostId={day.id}
                scheduledDate={day.date}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
  ```
- [ ] **PostingControls Component**
  ```typescript
  // /src/components/PostingControls.tsx
  export function PostingControls({ content, calendarPostId, scheduledDate }) {
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [scheduledTime, setScheduledTime] = useState<Date>();
    
    const handleSchedulePost = async () => {
      // Schedule post to selected social accounts
    };
    
    return (
      <div className="flex items-center gap-2">
        <SocialAccountSelector 
          onSelectionChange={setSelectedAccounts}
        />
        <TimeSelector 
          onTimeChange={setScheduledTime}
          suggestedTimes={getOptimalTimes()}
        />
        <Button onClick={handleSchedulePost}>
          Schedule Posts
        </Button>
      </div>
    );
  }
  ```

#### **Afternoon Tasks (4 hours)**
- [ ] **API Route Updates**
  ```typescript
  // Update /src/app/api/generate/route.ts
  export async function POST(request: Request) {
    // Existing calendar generation logic
    const weeklyCalendar = await generateWeeklyCalendar(params);
    
    // NEW: Auto-posting option
    if (params.autoPost) {
      await scheduleCalendarPosts({
        calendarPosts: weeklyCalendar.days,
        socialAccounts: userSocialAccounts,
        startDate: params.startDate
      });
    }
    
    return Response.json({
      success: true,
      weekly_calendar: weeklyCalendar,
      scheduled_posts: scheduledPosts // NEW
    });
  }
  ```
- [ ] **Queue Management UI**
  ```typescript
  // /src/components/PostingQueue.tsx
  export function PostingQueue() {
    const [queuedPosts, setQueuedPosts] = useState<QueuedPost[]>([]);
    
    return (
      <div className="space-y-4">
        <h2>Scheduled Posts</h2>
        {queuedPosts.map(post => (
          <QueuedPostCard 
            key={post.id}
            post={post}
            onCancel={() => cancelPost(post.id)}
            onReschedule={(newTime) => reschedulePost(post.id, newTime)}
          />
        ))}
      </div>
    );
  }
  ```

#### **Evening Tasks (2 hours)**
- [ ] **End-to-End Testing**
  - Test complete flow: Calendar generation → Account selection → Scheduling → Queue management
  - Test error scenarios and edge cases
  - Verify posting queue UI updates correctly

**🚀 SHIP: Release 1 - Auto-Posting Launch**

**Deliverable**: Auto-posting fully integrated with existing V1 calendar

### **DAY 5: AI Image Generation Foundation**
**Goal**: Begin DALL-E 3 integration for product images

#### **Morning Tasks (4 hours)**
- [ ] **DALL-E 3 Integration Setup**
  ```typescript
  // /src/lib/ai/image-generation.ts
  export class ImageGenerationService {
    private openaiClient: OpenAI;
    
    async generateProductImage(params: {
      productName: string;
      productDescription: string;
      brandColors: string[];
      style: 'product-card' | 'lifestyle' | 'quote';
      dimensions: '1024x1024' | '1024x1792' | '1792x1024';
    }): Promise<GeneratedImage> {
      const prompt = this.buildImagePrompt(params);
      
      const response = await this.openaiClient.images.generate({
        model: "dall-e-3",
        prompt,
        size: params.dimensions,
        quality: "standard",
        n: 1,
      });
      
      return {
        url: response.data[0].url!,
        prompt: prompt,
        style: params.style
      };
    }
    
    private buildImagePrompt(params: ImageParams): string {
      // Build detailed prompts for different styles
    }
  }
  ```
- [ ] **Brand Color Extraction**
  ```typescript
  // /src/lib/brand/color-extractor.ts
  export class BrandColorExtractor {
    async extractColorsFromStore(storeUrl: string): Promise<BrandColors> {
      // Scrape store homepage
      // Extract dominant colors from CSS and images
      // Return hex codes for primary, secondary, accent colors
    }
    
    async extractColorsFromLogo(logoUrl: string): Promise<string[]> {
      // Use image analysis to extract colors from logo
    }
  }
  ```

#### **Afternoon Tasks (4 hours)**
- [ ] **Image Template System**
  ```typescript
  // /src/lib/ai/image-templates.ts
  export const IMAGE_TEMPLATES = {
    'product-card': {
      name: 'Product Card',
      description: 'Clean product showcase with pricing',
      promptTemplate: `Professional product photography of {productName}, {productDescription}, studio lighting, white background, product photography style, high quality, {brandColors} color accents`,
      dimensions: '1024x1024' as const
    },
    'lifestyle': {
      name: 'Lifestyle',
      description: 'Product in real-world context',
      promptTemplate: `Lifestyle photography showing {productName} in use, {productDescription}, natural lighting, real environment, people using product, {brandColors} color scheme`,
      dimensions: '1024x1792' as const
    },
    'quote': {
      name: 'Quote Graphic',
      description: 'Inspirational quote with product',
      promptTemplate: `Minimalist design with inspirational quote about {productName}, {productDescription}, typography focus, {brandColors} color palette, social media graphic style`,
      dimensions: '1024x1024' as const
    }
  };
  ```
- [ ] **Image Storage System**
  ```typescript
  // /src/lib/storage/image-storage.ts
  export class ImageStorageService {
    async uploadGeneratedImage(imageUrl: string, metadata: ImageMetadata): Promise<string> {
      // Download image from DALL-E
      // Upload to Supabase Storage or CDN
      // Return permanent URL
    }
    
    async getImagesByPost(postId: string): Promise<StoredImage[]> {
      // Retrieve all generated images for a post
    }
  }
  ```

#### **Evening Tasks (2 hours)**
- [ ] **Database Schema for Images**
  ```sql
  CREATE TABLE calendar_generated_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_post_id UUID,
    original_url TEXT NOT NULL,
    stored_url TEXT NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    brand_colors JSONB,
    dimensions VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

**Deliverable**: DALL-E 3 integration ready, image templates defined

### **DAY 6: Image Generation UI Integration**
**Goal**: Add image generation to existing calendar interface

#### **Morning Tasks (4 hours)**
- [ ] **ImageGeneration Component**
  ```typescript
  // /src/components/ImageGeneration.tsx
  export function ImageGeneration({ product, brandColors }: ImageGenerationProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string>('product-card');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    
    const handleGenerate = async () => {
      setIsGenerating(true);
      try {
        const image = await generateProductImage({
          productName: product.title,
          productDescription: product.description,
          brandColors,
          style: selectedTemplate,
          dimensions: IMAGE_TEMPLATES[selectedTemplate].dimensions
        });
        setGeneratedImages(prev => [...prev, image]);
      } finally {
        setIsGenerating(false);
      }
    };
    
    return (
      <div className="space-y-4">
        <TemplateSelector 
          templates={IMAGE_TEMPLATES}
          selected={selectedTemplate}
          onSelect={setSelectedTemplate}
        />
        
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? 'Generating...' : 'Generate Image'}
        </Button>
        
        <ImagePreview images={generatedImages} />
      </div>
    );
  }
  ```
- [ ] **WeeklyCalendar Enhancement for Images**
  ```typescript
  // Update WeeklyCalendar to include image generation
  export function WeeklyCalendar({ weeklyCalendar, brandColors }: Props) {
    return (
      <div className="space-y-6">
        {weeklyCalendar.days.map((day) => (
          <div key={day.day} className="border rounded-lg p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Existing content */}
              <div>
                <h3>{day.day}</h3>
                <p>{day.content}</p>
                <PostingControls {...postingProps} />
              </div>
              
              {/* NEW: Image generation */}
              <div>
                <ImageGeneration 
                  product={day.featured_product}
                  brandColors={brandColors}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  ```

#### **Afternoon Tasks (4 hours)**
- [ ] **API Route for Image Generation**
  ```typescript
  // /src/app/api/generate-image/route.ts
  export async function POST(request: Request) {
    const { productId, templateType, brandColors } = await request.json();
    
    try {
      // Generate image with DALL-E 3
      const generatedImage = await imageService.generateProductImage({
        productName: product.title,
        productDescription: product.description,
        brandColors,
        style: templateType,
        dimensions: IMAGE_TEMPLATES[templateType].dimensions
      });
      
      // Store image
      const storedUrl = await imageStorage.uploadGeneratedImage(
        generatedImage.url,
        { productId, templateType, brandColors }
      );
      
      // Save to database
      await saveGeneratedImage({
        calendarPostId: postId,
        originalUrl: generatedImage.url,
        storedUrl,
        templateType,
        prompt: generatedImage.prompt,
        brandColors
      });
      
      return Response.json({
        success: true,
        image: {
          url: storedUrl,
          template: templateType,
          prompt: generatedImage.prompt
        }
      });
    } catch (error) {
      return Response.json({
        success: false,
        error: 'Failed to generate image'
      }, { status: 500 });
    }
  }
  ```
- [ ] **Brand Color Detection**
  ```typescript
  // /src/app/api/extract-brand-colors/route.ts
  export async function POST(request: Request) {
    const { storeUrl } = await request.json();
    
    try {
      const brandColors = await brandColorExtractor.extractColorsFromStore(storeUrl);
      
      return Response.json({
        success: true,
        brandColors: {
          primary: brandColors.primary,
          secondary: brandColors.secondary,
          accent: brandColors.accent
        }
      });
    } catch (error) {
      return Response.json({
        success: false,
        error: 'Failed to extract brand colors'
      }, { status: 500 });
    }
  }
  ```

#### **Evening Tasks (2 hours)**
- [ ] **Image Caching & Optimization**
  - Implement image caching to avoid regenerating same images
  - Add image compression for faster loading
  - Create fallback system for generation failures

**Deliverable**: Image generation integrated with calendar UI

### **DAY 7: Testing & Polish for Week 1**
**Goal**: Complete testing and prepare for Release 2

#### **All Day Tasks (8 hours)**
- [ ] **Comprehensive Testing**
  - Test auto-posting flow end-to-end
  - Test image generation with different templates
  - Test error scenarios and edge cases
  - Performance testing for image generation
- [ ] **UI/UX Polish**
  - Improve loading states for image generation
  - Add progress indicators for posting queue
  - Enhance mobile responsiveness
  - Fix any visual inconsistencies
- [ ] **Documentation Updates**
  - Update API documentation with new endpoints
  - Create user guide for auto-posting
  - Document image generation templates
- [ ] **Bug Fixes**
  - Fix any issues found during testing
  - Optimize performance bottlenecks
  - Improve error messages

**🎨 SHIP: Release 2 - AI Images (Day 8)**

**Week 1 Deliverable**: Auto-posting + AI image generation fully functional

---

## 📅 **WEEK 2: REVENUE TRACKING + VIDEO GENERATION (Days 8-14)**
**Goal**: Add revenue attribution and basic video generation
**Ship**: Release 3 (Day 12) - Revenue tracking, Release 4 (Day 16) - Video generation

### **DAY 8: Revenue Tracking Foundation**
**Goal**: Build UTM parameter system and Shopify webhook integration

#### **Morning Tasks (4 hours)**
- [ ] **UTM Parameter System**
  ```typescript
  // /src/lib/attribution/utm-generator.ts
  export class UTMGenerator {
    generateUTMParameters(params: {
      postId: string;
      platform: string;
      productId: string;
      campaignType: string;
    }): UTMParameters {
      return {
        utm_source: 'storecalendar',
        utm_medium: 'social',
        utm_campaign: `${params.campaignType}_${params.platform}`,
        utm_term: params.productId,
        utm_content: params.postId
      };
    }
    
    generateTrackingUrl(baseUrl: string, utmParams: UTMParameters): string {
      const url = new URL(baseUrl);
      Object.entries(utmParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      return url.toString();
    }
  }
  ```
- [ ] **Revenue Attribution Database**
  ```sql
  CREATE TABLE calendar_revenue_attribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_post_id UUID,
    queued_post_id UUID REFERENCES calendar_posting_queue(id),
    shopify_order_id VARCHAR(255) NOT NULL,
    utm_campaign VARCHAR(255),
    utm_content VARCHAR(255),
    utm_term VARCHAR(255),
    revenue DECIMAL(10,2) NOT NULL,
    order_data JSONB,
    attribution_confidence DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT NOW()
  );
  
  CREATE TABLE calendar_utm_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_post_id UUID,
    queued_post_id UUID,
    utm_parameters JSONB NOT NULL,
    click_count INTEGER DEFAULT 0,
    last_clicked TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

#### **Afternoon Tasks (4 hours)**
- [ ] **Shopify Webhook Listener**
  ```typescript
  // /src/app/api/webhooks/shopify/orders/route.ts
  export async function POST(request: Request) {
    const signature = request.headers.get('x-shopify-hmac-sha256');
    const body = await request.text();
    
    // Verify webhook signature
    if (!verifyShopifyWebhook(body, signature)) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const order = JSON.parse(body) as ShopifyOrder;
    
    try {
      // Extract UTM parameters from order
      const utmParams = extractUTMFromOrder(order);
      
      if (utmParams && utmParams.utm_source === 'storecalendar') {
        // Attribute revenue to specific post
        await attributeRevenueToPost({
          shopifyOrderId: order.id.toString(),
          utmContent: utmParams.utm_content,
          revenue: parseFloat(order.total_price),
          orderData: order
        });
        
        // Send real-time notification
        await sendRevenueNotification({
          postId: utmParams.utm_content,
          revenue: parseFloat(order.total_price),
          productName: order.line_items[0]?.title || 'Product'
        });
      }
      
      return Response.json({ success: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return Response.json({ error: 'Processing failed' }, { status: 500 });
    }
  }
  ```
- [ ] **Attribution Service**
  ```typescript
  // /src/lib/attribution/attribution-service.ts
  export class AttributionService {
    async attributeRevenueToPost(params: {
      shopifyOrderId: string;
      utmContent: string;
      revenue: number;
      orderData: ShopifyOrder;
    }): Promise<void> {
      // Find the queued post by UTM content
      const queuedPost = await findQueuedPostByUTM(params.utmContent);
      
      if (queuedPost) {
        // Save attribution record
        await saveRevenueAttribution({
          calendarPostId: queuedPost.calendar_post_id,
          queuedPostId: queuedPost.id,
          shopifyOrderId: params.shopifyOrderId,
          revenue: params.revenue,
          orderData: params.orderData
        });
      }
    }
    
    async getPostRevenue(postId: string): Promise<PostRevenueData> {
      // Calculate total revenue, order count, average order value
    }
    
    async getRevenueByTimeframe(userId: string, days: number): Promise<RevenueData[]> {
      // Get revenue data for charts and analytics
    }
  }
  ```

#### **Evening Tasks (2 hours)**
- [ ] **Webhook Security & Validation**
  - Implement Shopify webhook signature verification
  - Add rate limiting for webhook endpoints
  - Create webhook retry mechanism for failures

**Deliverable**: Revenue attribution foundation with Shopify integration

### **DAY 9: Revenue Notifications & Analytics**
**Goal**: Build real-time revenue notifications and analytics dashboard

#### **Morning Tasks (4 hours)**
- [ ] **Real-Time Notifications**
  ```typescript
  // /src/lib/notifications/revenue-notifications.ts
  export class RevenueNotificationService {
    async sendRevenueNotification(params: {
      userId: string;
      postId: string;
      revenue: number;
      productName: string;
      orderCount?: number;
    }): Promise<void> {
      const message = this.formatRevenueMessage(params);
      
      // Send via multiple channels
      await Promise.all([
        this.sendWebPushNotification(params.userId, message),
        this.sendEmailNotification(params.userId, message),
        this.saveInAppNotification(params.userId, message)
      ]);
    }
    
    private formatRevenueMessage(params: NotificationParams): string {
      const { revenue, productName, orderCount = 1 } = params;
      
      if (orderCount === 1) {
        return `🎉 Your ${productName} post earned $${revenue.toFixed(2)}!`;
      } else {
        return `🎉 Your ${productName} post earned $${revenue.toFixed(2)} from ${orderCount} orders!`;
      }
    }
  }
  ```
- [ ] **In-App Notification System**
  ```typescript
  // /src/components/RevenueNotifications.tsx
  export function RevenueNotifications() {
    const [notifications, setNotifications] = useState<RevenueNotification[]>([]);
    
    useEffect(() => {
      // Set up real-time subscription for new revenue notifications
      const subscription = supabase
        .channel('revenue_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'calendar_revenue_attribution'
        }, (payload) => {
          const newNotification = formatNotification(payload.new);
          setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
          
          // Show toast notification
          toast.success(newNotification.message);
        })
        .subscribe();
      
      return () => subscription.unsubscribe();
    }, []);
    
    return (
      <div className="space-y-2">
        {notifications.map(notification => (
          <RevenueNotificationCard key={notification.id} notification={notification} />
        ))}
      </div>
    );
  }
  ```

#### **Afternoon Tasks (4 hours)**
- [ ] **Revenue Analytics Dashboard**
  ```typescript
  // /src/components/RevenueAnalytics.tsx
  export function RevenueAnalytics({ userId }: { userId: string }) {
    const [revenueData, setRevenueData] = useState<RevenueAnalytics>();
    const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
    
    return (
      <div className="space-y-6">
        {/* Revenue Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <RevenueCard 
            title="Total Revenue"
            value={`$${revenueData?.totalRevenue || 0}`}
            change={revenueData?.revenueChange}
          />
          <RevenueCard 
            title="Orders Attributed"
            value={revenueData?.orderCount || 0}
            change={revenueData?.orderChange}
          />
          <RevenueCard 
            title="Best Performing Post"
            value={`$${revenueData?.bestPostRevenue || 0}`}
            subtitle={revenueData?.bestPostProduct}
          />
          <RevenueCard 
            title="Average Order Value"
            value={`$${revenueData?.averageOrderValue || 0}`}
            change={revenueData?.aovChange}
          />
        </div>
        
        {/* Revenue Chart */}
        <RevenueChart 
          data={revenueData?.dailyRevenue || []}
          timeframe={timeframe}
        />
        
        {/* Top Performing Posts */}
        <TopPerformingPosts posts={revenueData?.topPosts || []} />
      </div>
    );
  }
  ```
- [ ] **Post Performance Integration**
  ```typescript
  // Update WeeklyCalendar to show revenue data
  export function WeeklyCalendar({ weeklyCalendar }: Props) {
    const [postRevenue, setPostRevenue] = useState<Record<string, number>>({});
    
    useEffect(() => {
      // Load revenue data for each post
      weeklyCalendar.days.forEach(async (day) => {
        const revenue = await getPostRevenue(day.id);
        setPostRevenue(prev => ({ ...prev, [day.id]: revenue.total }));
      });
    }, [weeklyCalendar]);
    
    return (
      <div className="space-y-6">
        {weeklyCalendar.days.map((day) => (
          <div key={day.day} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <h3>{day.day}</h3>
              {/* NEW: Revenue indicator */}
              {postRevenue[day.id] > 0 && (
                <RevenueIndicator 
                  amount={postRevenue[day.id]}
                  className="text-green-600 font-semibold"
                />
              )}
            </div>
            
            <p>{day.content}</p>
            
            {/* Revenue details */}
            {postRevenue[day.id] > 0 && (
              <RevenueDetails postId={day.id} />
            )}
            
            <PostingControls {...postingProps} />
            <ImageGeneration {...imageProps} />
          </div>
        ))}
      </div>
    );
  }
  ```

#### **Evening Tasks (2 hours)**
- [ ] **API Routes for Analytics**
  ```typescript
  // /src/app/api/analytics/revenue/route.ts
  export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';
    const userId = await getCurrentUserId(request);
    
    const analytics = await getRevenueAnalytics(userId, timeframe);
    
    return Response.json({
      success: true,
      analytics
    });
  }
  ```

**Deliverable**: Real-time revenue notifications and analytics dashboard

### **DAY 10: Revenue Dashboard Polish**
**Goal**: Complete revenue tracking system and prepare for launch

#### **Morning Tasks (4 hours)**
- [ ] **Enhanced Post Performance View**
  ```typescript
  // /src/components/PostPerformanceDetails.tsx
  export function PostPerformanceDetails({ postId }: { postId: string }) {
    const [performance, setPerformance] = useState<PostPerformance>();
    
    return (
      <div className="bg-gray-50 p-4 rounded-lg mt-4">
        <h4 className="font-semibold mb-3">Post Performance</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Revenue</span>
            <p className="font-bold text-green-600">
              ${performance?.revenue || 0}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Orders</span>
            <p className="font-bold">{performance?.orderCount || 0}</p>
          </div>
          <div>
            <span className="text-gray-600">Clicks</span>
            <p className="font-bold">{performance?.clickCount || 0}</p>
          </div>
          <div>
            <span className="text-gray-600">Conversion Rate</span>
            <p className="font-bold">{performance?.conversionRate || 0}%</p>
          </div>
        </div>
        
        {performance?.revenue > 0 && (
          <div className="mt-3 p-2 bg-green-100 rounded">
            <p className="text-green-800 text-sm">
              🎉 This post generated revenue! Consider creating similar content.
            </p>
          </div>
        )}
      </div>
    );
  }
  ```
- [ ] **Revenue Export Functionality**
  ```typescript
  // /src/lib/export/revenue-export.ts
  export class RevenueExportService {
    async exportRevenueReport(userId: string, timeframe: string): Promise<Blob> {
      const revenueData = await getDetailedRevenueData(userId, timeframe);
      
      const csvContent = this.formatRevenueDataAsCSV(revenueData);
      return new Blob([csvContent], { type: 'text/csv' });
    }
    
    private formatRevenueDataAsCSV(data: RevenueData[]): string {
      const headers = ['Date', 'Post Content', 'Platform', 'Product', 'Revenue', 'Orders', 'AOV'];
      const rows = data.map(row => [
        row.date,
        row.postContent,
        row.platform,
        row.productName,
        row.revenue,
        row.orderCount,
        row.averageOrderValue
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
  ```

#### **Afternoon Tasks (4 hours)**
- [ ] **UTM Integration with Posting**
  ```typescript
  // Update PostingControls to include UTM generation
  export function PostingControls({ content, calendarPostId, productId }: Props) {
    const handleSchedulePost = async () => {
      // Generate UTM parameters for this post
      const utmParams = utmGenerator.generateUTMParameters({
        postId: calendarPostId,
        platform: selectedPlatform,
        productId: productId,
        campaignType: 'organic'
      });
      
      // Add tracking URL to post content
      const trackingUrl = utmGenerator.generateTrackingUrl(
        getProductUrl(productId),
        utmParams
      );
      
      const enhancedContent = `${content}\n\nShop now: ${trackingUrl}`;
      
      // Schedule post with UTM tracking
      await schedulePost({
        content: enhancedContent,
        utmParameters: utmParams,
        calendarPostId,
        scheduledTime
      });
    };
    
    // ... rest of component
  }
  ```
- [ ] **Revenue Tracking Testing**
  - Create test Shopify webhook payloads
  - Test attribution accuracy with different UTM scenarios
  - Verify notification delivery across all channels
  - Test analytics data accuracy

#### **Evening Tasks (2 hours)**
- [ ] **Documentation & Error Handling**
  - Document revenue tracking setup for users
  - Add comprehensive error handling for edge cases
  - Create troubleshooting guide for common issues

**Deliverable**: Complete revenue tracking system ready for launch

### **DAY 11: Video Generation Foundation**
**Goal**: Begin implementing AI video generation for products

#### **Morning Tasks (4 hours)**
- [ ] **Video Generation Research & Setup**
  ```typescript
  // /src/lib/ai/video-generation.ts
  export class VideoGenerationService {
    private ffmpegPath: string;
    
    async generateProductSlideshow(params: {
      productImages: string[];
      productName: string;
      productPrice: string;
      brandColors: string[];
      musicTrack?: string;
      duration: number;
    }): Promise<GeneratedVideo> {
      // Create slideshow video with Ken Burns effect
      const tempDir = await this.createTempDirectory();
      
      // Download and process images
      const processedImages = await this.processImagesForVideo(
        params.productImages,
        tempDir
      );
      
      // Generate video with FFmpeg
      const videoPath = await this.createSlideshowVideo({
        images: processedImages,
        duration: params.duration,
        outputPath: path.join(tempDir, 'output.mp4')
      });
      
      // Add text overlays
      const finalVideo = await this.addTextOverlays(videoPath, {
        productName: params.productName,
        productPrice: params.productPrice,
        brandColors: params.brandColors
      });
      
      // Add background music if provided
      if (params.musicTrack) {
        return await this.addBackgroundMusic(finalVideo, params.musicTrack);
      }
      
      return {
        videoPath: finalVideo,
        duration: params.duration,
        dimensions: '1080x1920' // Instagram Stories format
      };
    }
    
    private async createSlideshowVideo(params: VideoParams): Promise<string> {
      // Use FFmpeg to create slideshow with Ken Burns effect
      const command = `ffmpeg -y ` +
        `-loop 1 -t ${params.duration / params.images.length} -i ${params.images[0]} ` +
        `-filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0015,1.5)':d=${params.duration * 25}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920[v]" ` +
        `-map "[v]" -c:v libx264 -pix_fmt yuv420p ${params.outputPath}`;
      
      await exec(command);
      return params.outputPath;
    }
  }
  ```
- [ ] **Music Library Integration**
  ```typescript
  // /src/lib/media/music-library.ts
  export class MusicLibraryService {
    private musicTracks = [
      { id: 'upbeat-1', name: 'Upbeat Commercial', duration: 30, genre: 'commercial' },
      { id: 'chill-1', name: 'Chill Vibes', duration: 30, genre: 'ambient' },
      { id: 'energetic-1', name: 'Energetic Pop', duration: 30, genre: 'pop' }
    ];
    
    async getMusicTrackForProduct(productCategory: string): Promise<MusicTrack> {
      // Select appropriate music based on product category
      const mapping = {
        'fashion': 'upbeat-1',
        'home': 'chill-1',
        'electronics': 'energetic-1'
      };
      
      const trackId = mapping[productCategory] || 'upbeat-1';
      return this.getMusicTrack(trackId);
    }
    
    async downloadMusicTrack(trackId: string): Promise<string> {
      // Download royalty-free music track
    }
  }
  ```

#### **Afternoon Tasks (4 hours)**
- [ ] **Video Templates System**
  ```typescript
  // /src/lib/ai/video-templates.ts
  export const VIDEO_TEMPLATES = {
    'product-showcase': {
      name: 'Product Showcase',
      description: 'Professional product reveal with pricing',
      duration: 15,
      scenes: [
        { type: 'product-intro', duration: 5, text: 'Introducing {productName}' },
        { type: 'product-details', duration: 7, text: '{productDescription}' },
        { type: 'call-to-action', duration: 3, text: 'Shop now for {productPrice}' }
      ]
    },
    'lifestyle': {
      name: 'Lifestyle Story',
      description: 'Product in real-world context',
      duration: 20,
      scenes: [
        { type: 'lifestyle-intro', duration: 6, text: 'Transform your {category}' },
        { type: 'product-reveal', duration: 8, text: 'Meet {productName}' },
        { type: 'benefits', duration: 6, text: '{keyBenefits}' }
      ]
    },
    'testimonial': {
      name: 'Customer Testimonial',
      description: 'Social proof with customer reviews',
      duration: 18,
      scenes: [
        { type: 'review-intro', duration: 5, text: 'What customers say' },
        { type: 'testimonial', duration: 10, text: '{customerReview}' },
        { type: 'product-cta', duration: 3, text: 'Experience it yourself' }
      ]
    }
  };
  ```
- [ ] **Video Storage & Processing**
  ```typescript
  // /src/lib/storage/video-storage.ts
  export class VideoStorageService {
    async uploadGeneratedVideo(videoPath: string, metadata: VideoMetadata): Promise<string> {
      // Upload to cloud storage (Supabase Storage or AWS S3)
      const videoBuffer = await fs.readFile(videoPath);
      
      const uploadPath = `videos/${metadata.userId}/${metadata.videoId}.mp4`;
      const { data, error } = await supabase.storage
        .from('generated-videos')
        .upload(uploadPath, videoBuffer);
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('generated-videos')
        .getPublicUrl(uploadPath);
      
      return urlData.publicUrl;
    }
    
    async getVideosByPost(postId: string): Promise<StoredVideo[]> {
      // Retrieve all generated videos for a post
    }
  }
  ```

#### **Evening Tasks (2 hours)**
- [ ] **Video Database Schema**
  ```sql
  CREATE TABLE calendar_generated_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_post_id UUID,
    template_type VARCHAR(50) NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER NOT NULL,
    dimensions VARCHAR(20),
    music_track VARCHAR(100),
    brand_colors JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

**🚀 SHIP: Release 3 - Revenue Tracking (Premium Feature)**

**Deliverable**: Video generation foundation ready

### **DAY 12: Video Generation UI & Integration**
**Goal**: Complete video generation and integrate with calendar

#### **Morning Tasks (4 hours)**
- [ ] **VideoGeneration Component**
  ```typescript
  // /src/components/VideoGeneration.tsx
  export function VideoGeneration({ product, brandColors }: VideoGenerationProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string>('product-showcase');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
    const [progress, setProgress] = useState(0);
    
    const handleGenerate = async () => {
      setIsGenerating(true);
      setProgress(0);
      
      try {
        // Start video generation with progress tracking
        const videoJob = await startVideoGeneration({
          productName: product.title,
          productDescription: product.description,
          productPrice: product.price,
          productImages: product.images,
          brandColors,
          template: selectedTemplate
        });
        
        // Poll for progress
        const interval = setInterval(async () => {
          const status = await checkVideoProgress(videoJob.id);
          setProgress(status.progress);
          
          if (status.complete) {
            clearInterval(interval);
            setGeneratedVideos(prev => [...prev, status.video]);
            setIsGenerating(false);
          }
        }, 2000);
        
      } catch (error) {
        setIsGenerating(false);
        toast.error('Failed to generate video');
      }
    };
    
    return (
      <div className="space-y-4">
        <VideoTemplateSelector 
          templates={VIDEO_TEMPLATES}
          selected={selectedTemplate}
          onSelect={setSelectedTemplate}
        />
        
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? `Generating... ${progress}%` : 'Generate Video'}
        </Button>
        
        {isGenerating && (
          <ProgressBar progress={progress} />
        )}
        
        <VideoPreview videos={generatedVideos} />
      </div>
    );
  }
  ```
- [ ] **Video Progress Tracking**
  ```typescript
  // /src/lib/ai/video-job-manager.ts
  export class VideoJobManager {
    private jobs = new Map<string, VideoJob>();
    
    async startVideoGeneration(params: VideoGenerationParams): Promise<{ id: string }> {
      const jobId = generateId();
      
      const job: VideoJob = {
        id: jobId,
        status: 'starting',
        progress: 0,
        startTime: new Date(),
        params
      };
      
      this.jobs.set(jobId, job);
      
      // Start background processing
      this.processVideoJob(jobId);
      
      return { id: jobId };
    }
    
    async getJobStatus(jobId: string): Promise<VideoJobStatus> {
      const job = this.jobs.get(jobId);
      if (!job) throw new Error('Job not found');
      
      return {
        id: jobId,
        status: job.status,
        progress: job.progress,
        video: job.result,
        complete: job.status === 'completed'
      };
    }
    
    private async processVideoJob(jobId: string): Promise<void> {
      const job = this.jobs.get(jobId)!;
      
      try {
        job.status = 'processing';
        job.progress = 10;
        
        // Generate video (this takes time)
        const video = await this.videoService.generateProductSlideshow(job.params);
        job.progress = 80;
        
        // Upload to storage
        const videoUrl = await this.videoStorage.uploadGeneratedVideo(
          video.videoPath,
          { userId: job.params.userId, videoId: jobId }
        );
        job.progress = 100;
        
        job.result = { ...video, url: videoUrl };
        job.status = 'completed';
        
      } catch (error) {
        job.status = 'failed';
        job.error = error.message;
      }
    }
  }
  ```

#### **Afternoon Tasks (4 hours)**
- [ ] **API Routes for Video Generation**
  ```typescript
  // /src/app/api/generate-video/route.ts
  export async function POST(request: Request) {
    const params = await request.json();
    const userId = await getCurrentUserId(request);
    
    try {
      const job = await videoJobManager.startVideoGeneration({
        ...params,
        userId
      });
      
      return Response.json({
        success: true,
        jobId: job.id
      });
    } catch (error) {
      return Response.json({
        success: false,
        error: 'Failed to start video generation'
      }, { status: 500 });
    }
  }
  
  // /src/app/api/video-status/[jobId]/route.ts
  export async function GET(request: Request, { params }: { params: { jobId: string } }) {
    try {
      const status = await videoJobManager.getJobStatus(params.jobId);
      
      return Response.json({
        success: true,
        status
      });
    } catch (error) {
      return Response.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }
  }
  ```
- [ ] **WeeklyCalendar Enhancement for Videos**
  ```typescript
  // Update WeeklyCalendar to include video generation
  export function WeeklyCalendar({ weeklyCalendar, brandColors }: Props) {
    return (
      <div className="space-y-6">
        {weeklyCalendar.days.map((day) => (
          <div key={day.day} className="border rounded-lg p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Existing content */}
              <div>
                <h3>{day.day}</h3>
                <p>{day.content}</p>
                <PostingControls {...postingProps} />
                {postRevenue[day.id] > 0 && (
                  <RevenueDetails postId={day.id} />
                )}
              </div>
              
              {/* Image generation */}
              <div>
                <h4 className="font-semibold mb-2">Generate Images</h4>
                <ImageGeneration 
                  product={day.featured_product}
                  brandColors={brandColors}
                />
              </div>
              
              {/* NEW: Video generation */}
              <div>
                <h4 className="font-semibold mb-2">Generate Videos</h4>
                <VideoGeneration 
                  product={day.featured_product}
                  brandColors={brandColors}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  ```

#### **Evening Tasks (2 hours)**
- [ ] **Video Optimization & Testing**
  - Test video generation with different templates
  - Optimize video compression for faster uploads
  - Test video playback across different devices

**Deliverable**: Video generation integrated with calendar UI

### **DAY 13: Premium Features Polish**
**Goal**: Polish revenue tracking and video generation for premium launch

#### **All Day Tasks (8 hours)**
- [ ] **Premium Feature Gating**
  ```typescript
  // /src/components/PremiumFeatureGate.tsx
  export function PremiumFeatureGate({ 
    feature, 
    children, 
    fallback 
  }: PremiumFeatureGateProps) {
    const { user, subscription } = useUser();
    
    const hasAccess = subscription?.plan === 'premium' || subscription?.plan === 'enterprise';
    
    if (!hasAccess) {
      return (
        <div className="relative">
          <div className="opacity-50 pointer-events-none">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="text-center space-y-4">
              <h3 className="font-semibold">Upgrade to Premium</h3>
              <p className="text-sm text-gray-600">
                Unlock {feature} and track revenue from your posts
              </p>
              <Button onClick={() => openUpgradeModal()}>
                Upgrade Now - $47/month
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return <>{children}</>;
  }
  ```
- [ ] **Subscription Management**
  ```typescript
  // /src/lib/subscription/subscription-service.ts
  export class SubscriptionService {
    async createSubscription(userId: string, plan: 'premium' | 'enterprise'): Promise<string> {
      // Create Stripe subscription
      const priceId = plan === 'premium' ? PREMIUM_PRICE_ID : ENTERPRISE_PRICE_ID;
      
      const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?upgraded=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
        metadata: { userId, plan }
      });
      
      return session.url!;
    }
    
    async handleWebhook(event: Stripe.Event): Promise<void> {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.activateSubscription(session);
      }
    }
  }
  ```
- [ ] **Comprehensive Testing**
  - Test all premium features end-to-end
  - Test subscription upgrade flow
  - Test revenue attribution accuracy
  - Test video generation performance
- [ ] **Performance Optimization**
  - Optimize image and video generation speed
  - Implement proper caching strategies
  - Optimize database queries for analytics

**🎬 SHIP: Release 4 - Video Generation (Premium Feature)**

**Week 2 Deliverable**: Complete premium features with revenue tracking and video generation

---

## 📅 **WEEK 3: OPTIMIZATION & ADVANCED FEATURES (Days 15-21)**
**Goal**: Add winner detection, multi-store support, mobile optimization
**Ship**: Release 5 (Day 24) - Advanced platform features

### **DAY 14: Winner Detection Algorithm**
**Goal**: Build system to identify high-performing posts and create variations

#### **Morning Tasks (4 hours)**
- [ ] **Winner Detection Service**
  ```typescript
  // /src/lib/analytics/winner-detection.ts
  export class WinnerDetectionService {
    async identifyWinners(userId: string, criteria: WinnerCriteria = DEFAULT_CRITERIA): Promise<WinnerPost[]> {
      const posts = await this.getPostsWithRevenue(userId, criteria.timeframe);
      
      return posts.filter(post => 
        post.revenue >= criteria.minRevenue &&
        post.engagementRate >= criteria.minEngagementRate &&
        post.conversionRate >= criteria.minConversionRate
      ).sort((a, b) => b.revenue - a.revenue);
    }
    
    async generateWinnerVariations(winnerId: string, variationCount: number = 3): Promise<PostVariation[]> {
      const winnerPost = await this.getPostDetails(winnerId);
      
      const variations = await Promise.all(
        Array(variationCount).fill(0).map(async (_, index) => {
          const variation = await this.generateVariation(winnerPost, index);
          return variation;
        })
      );
      
      return variations;
    }
    
    private async generateVariation(originalPost: Post, variationIndex: number): Promise<PostVariation> {
      const variationPrompts = [
        'Create a similar post with different angle',
        'Emphasize different product benefits',
        'Use different call-to-action approach'
      ];
      
      const prompt = `${variationPrompts[variationIndex]}: ${originalPost.content}`;
      
      const variation = await this.openaiService.generateContent({
        prompt,
        style: originalPost.brandTone,
        product: originalPost.product
      });
      
      return {
        originalPostId: originalPost.id,
        content: variation.content,
        variationType: variationPrompts[variationIndex],
        estimatedPerformance: this.predictPerformance(variation, originalPost)
      };
    }
  }
  ```
- [ ] **Performance Prediction**
  ```typescript
  // /src/lib/analytics/performance-predictor.ts
  export class PerformancePredictorService {
    async predictPostPerformance(post: PostData): Promise<PerformancePrediction> {
      // Analyze content characteristics
      const contentFeatures = this.extractContentFeatures(post);
      
      // Get historical performance data
      const historicalData = await this.getHistoricalPerformance(post.userId);
      
      // Simple ML-based prediction
      const prediction = this.calculatePrediction(contentFeatures, historicalData);
      
      return {
        expectedRevenue: prediction.revenue,
        expectedEngagement: prediction.engagement,
        confidence: prediction.confidence,
        recommendations: this.generateRecommendations(contentFeatures)
      };
    }
    
    private extractContentFeatures(post: PostData): ContentFeatures {
      return {
        wordCount: post.content.split(' ').length,
        hasEmojis: /[\u{1F600}-\u{1F64F}]|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}/u.test(post.content),
        hasHashtags: post.content.includes('#'),
        hasCallToAction: /shop|buy|order|get|purchase/i.test(post.content),
        sentimentScore: this.analyzeSentiment(post.content),
        productCategory: post.product.category
      };
    }
  }
  ```

#### **Afternoon Tasks (4 hours)**
- [ ] **Winner Dashboard Component**
  ```typescript
  // /src/components/WinnerDashboard.tsx
  export function WinnerDashboard({ userId }: { userId: string }) {
    const [winners, setWinners] = useState<WinnerPost[]>([]);
    const [generating, setGenerating] = useState<string | null>(null);
    
    const handleGenerateVariations = async (winnerId: string) => {
      setGenerating(winnerId);
      try {
        const variations = await generateWinnerVariations(winnerId, 3);
        // Show variations for scheduling
        openVariationModal(variations);
      } finally {
        setGenerating(null);
      }
    };
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">🏆 Winning Posts</h2>
          <Button onClick={() => refreshWinners()}>
            Refresh Winners
          </Button>
        </div>
        
        {winners.map(winner => (
          <WinnerCard 
            key={winner.id}
            winner={winner}
            onGenerateVariations={() => handleGenerateVariations(winner.id)}
            isGenerating={generating === winner.id}
          />
        ))}
        
        {winners.length === 0 && (
          <EmptyState 
            title="No winners yet"
            description="Keep posting and tracking revenue to identify your winning content!"
          />
        )}
      </div>
    );
  }
  ```
- [ ] **Variation Scheduling Modal**
  ```typescript
  // /src/components/VariationSchedulingModal.tsx
  export function VariationSchedulingModal({ 
    variations, 
    isOpen, 
    onClose 
  }: VariationModalProps) {
    const [selectedVariations, setSelectedVariations] = useState<string[]>([]);
    const [schedulingDates, setSchedulingDates] = useState<Record<string, Date>>({});
    
    const handleScheduleVariations = async () => {
      const schedulingPromises = selectedVariations.map(async (variationId) => {
        const variation = variations.find(v => v.id === variationId);
        const scheduledDate = schedulingDates[variationId];
        
        return schedulePost({
          content: variation.content,
          scheduledTime: scheduledDate,
          isVariation: true,
          originalPostId: variation.originalPostId
        });
      });
      
      await Promise.all(schedulingPromises);
      toast.success(`Scheduled ${selectedVariations.length} variations`);
      onClose();
    };
    
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Schedule Winner Variations">
        <div className="space-y-4">
          {variations.map(variation => (
            <VariationPreview 
              key={variation.id}
              variation={variation}
              isSelected={selectedVariations.includes(variation.id)}
              onToggle={(selected) => toggleVariationSelection(variation.id, selected)}
              onDateChange={(date) => setSchedulingDates(prev => ({ 
                ...prev, 
                [variation.id]: date 
              }))}
            />
          ))}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleScheduleVariations}
              disabled={selectedVariations.length === 0}
            >
              Schedule {selectedVariations.length} Variations
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
  ```

#### **Evening Tasks (2 hours)**
- [ ] **Winner Detection API**
  ```typescript
  // /src/app/api/winners/route.ts
  export async function GET(request: Request) {
    const userId = await getCurrentUserId(request);
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';
    
    const winners = await winnerDetectionService.identifyWinners(userId, {
      timeframe,
      minRevenue: 100,
      minEngagementRate: 0.02,
      minConversionRate: 0.01
    });
    
    return Response.json({
      success: true,
      winners
    });
  }
  
  // /src/app/api/winners/[id]/variations/route.ts
  export async function POST(request: Request, { params }: { params: { id: string } }) {
    const { variationCount = 3 } = await request.json();
    
    const variations = await winnerDetectionService.generateWinnerVariations(
      params.id,
      variationCount
    );
    
    return Response.json({
      success: true,
      variations
    });
  }
  ```

**Deliverable**: Winner detection and variation generation system

### **DAY 15-17: Multi-Store Support & Mobile Optimization**
**Goal**: Add support for multiple stores and optimize for mobile

#### **Day 15: Multi-Store Foundation**
- [ ] **Store Management System**
  ```typescript
  // /src/lib/stores/store-manager.ts
  export class StoreManager {
    async addStore(userId: string, storeData: StoreData): Promise<Store> {
      // Validate store URL and extract Shopify domain
      const validatedStore = await this.validateStore(storeData.url);
      
      // Extract brand colors and metadata
      const brandData = await this.extractBrandData(storeData.url);
      
      // Save to database
      const store = await this.saveStore({
        userId,
        name: storeData.name,
        url: storeData.url,
        domain: validatedStore.domain,
        brandColors: brandData.colors,
        metadata: brandData.metadata
      });
      
      return store;
    }
    
    async getUserStores(userId: string): Promise<Store[]> {
      return await this.db.query(
        'SELECT * FROM calendar_stores WHERE user_id = $1 ORDER BY created_at',
        [userId]
      );
    }
    
    async switchActiveStore(userId: string, storeId: string): Promise<void> {
      await this.db.query(
        'UPDATE calendar_users SET active_store_id = $1 WHERE id = $2',
        [storeId, userId]
      );
    }
  }
  ```

#### **Day 16: Mobile Optimization**
- [ ] **Responsive UI Components**
  ```typescript
  // Update all components for mobile-first design
  // /src/components/MobileOptimizedCalendar.tsx
  export function MobileOptimizedCalendar({ weeklyCalendar }: Props) {
    const [activeTab, setActiveTab] = useState<'content' | 'images' | 'videos'>('content');
    
    return (
      <div className="space-y-4">
        {weeklyCalendar.days.map((day) => (
          <div key={day.day} className="border rounded-lg p-4">
            {/* Mobile tab navigation */}
            <div className="flex border-b mb-4 md:hidden">
              <TabButton 
                active={activeTab === 'content'}
                onClick={() => setActiveTab('content')}
              >
                Content
              </TabButton>
              <TabButton 
                active={activeTab === 'images'}
                onClick={() => setActiveTab('images')}
              >
                Images
              </TabButton>
              <TabButton 
                active={activeTab === 'videos'}
                onClick={() => setActiveTab('videos')}
              >
                Videos
              </TabButton>
            </div>
            
            {/* Content based on active tab */}
            {activeTab === 'content' && (
              <PostContent day={day} />
            )}
            {activeTab === 'images' && (
              <ImageGeneration product={day.featured_product} />
            )}
            {activeTab === 'videos' && (
              <VideoGeneration product={day.featured_product} />
            )}
          </div>
        ))}
      </div>
    );
  }
  ```

#### **Day 17: Advanced Analytics**
- [ ] **Cross-Store Analytics**
- [ ] **Performance Comparison Tools**
- [ ] **Unified Reporting Dashboard**

**Deliverable**: Multi-store support and mobile-optimized interface

### **DAY 18-21: Final Polish & Advanced Features**
**Goal**: Complete all remaining features and optimize for launch

#### **Day 18-19: Advanced Features**
- [ ] **Optimal Posting Time Recommendations**
- [ ] **Enhanced Brand Consistency Tools**
- [ ] **Advanced Image/Video Templates**

#### **Day 20-21: Final Polish**
- [ ] **Performance Optimization**
- [ ] **Comprehensive Testing**
- [ ] **User Experience Improvements**
- [ ] **Documentation Updates**

**🚀 SHIP: Release 5 - Advanced Platform Features**

**Week 3 Deliverable**: Complete platform with all advanced features

---

## 📅 **WEEK 4: LAUNCH PREPARATION & OPTIMIZATION (Days 22-30)**
**Goal**: Final optimizations, launch preparation, and customer acquisition

### **DAY 22-24: Launch Optimization**
- [ ] **Performance Testing & Optimization**
- [ ] **Load Testing for High Traffic**
- [ ] **Security Audit & Fixes**
- [ ] **User Onboarding Flow Optimization**

### **DAY 25-27: Marketing & Conversion**
- [ ] **Success Story Collection**
- [ ] **Conversion Funnel Optimization**
- [ ] **Referral System Implementation**
- [ ] **Customer Support Documentation**

### **DAY 28-30: Final Launch Push**
- [ ] **Final Bug Fixes**
- [ ] **Launch Marketing Campaign**
- [ ] **Customer Success Tracking**
- [ ] **Next Phase Planning**

---

## 📊 **TECHNICAL SUCCESS METRICS**

### **Code Quality Targets**
- **Total Lines**: 15,000-20,000 lines of quality TypeScript
- **Test Coverage**: 80%+ for core features
- **Performance**: <2s load time for all features
- **Error Rate**: <1% for all API endpoints

### **Feature Completion**
- ✅ Auto-posting (Instagram + LinkedIn)
- ✅ AI Image Generation (DALL-E 3 + templates)
- ✅ AI Video Generation (slideshows + music)
- ✅ Revenue Attribution (UTM + Shopify webhooks)
- ✅ Winner Detection & Variations
- ✅ Multi-store Support
- ✅ Mobile Optimization

### **Technical Architecture**
```
StoreCalendar V2 Architecture:
├── V1 Foundation (EXISTING)
│   ├── Holiday-aware calendar generation
│   ├── Product ranking & selection
│   ├── Brand tone system
│   └── Shopify integration
├── Auto-Posting Layer (NEW)
│   ├── Social media OAuth
│   ├── Posting queue management
│   └── Platform-specific formatting
├── AI Content Generation (NEW)
│   ├── DALL-E 3 image generation
│   ├── Video slideshow creation
│   └── Brand-consistent templates
├── Revenue Attribution (NEW)
│   ├── UTM parameter system
│   ├── Shopify webhook processing
│   └── Real-time notifications
└── Analytics & Intelligence (NEW)
    ├── Winner detection
    ├── Performance prediction
    └── Multi-store analytics
```

**By Day 30, we'll have a complete e-commerce content platform that:**
- Auto-posts to social media with revenue tracking
- Generates AI-powered images and videos
- Provides intelligent analytics and winner detection
- Positions for multi-platform expansion (WooCommerce Month 2)
- Offers competitive $29 early access pricing
- Built on our solid V1 Shopify foundation with broader market appeal