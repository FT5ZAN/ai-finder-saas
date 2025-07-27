// CommonJS version of test data seeder to avoid ES module import issues
const mongoose = require('mongoose');

// Test data for E2E testing
const TEST_TOOLS = [
  {
    title: "Test AI Writing Tool",
    logoUrl: "https://via.placeholder.com/40x40/667eea/ffffff?text=AI",
    websiteUrl: "https://example.com/ai-writing",
    category: "Writing",
    about: "An advanced AI-powered writing assistant that helps create compelling content.",
    keywords: ["writing", "content", "ai", "assistant", "text"],
    toolType: "browser",
    likeCount: 15,
    saveCount: 8
  },
  {
    title: "Test Design AI",
    logoUrl: "https://via.placeholder.com/40x40/667eea/ffffff?text=DS",
    websiteUrl: "https://example.com/design-ai",
    category: "Design",
    about: "AI-powered design tool for creating stunning graphics and layouts.",
    keywords: ["design", "graphics", "ai", "layout", "visual"],
    toolType: "browser",
    likeCount: 22,
    saveCount: 12
  },
  {
    title: "Test Coding Assistant",
    logoUrl: "https://via.placeholder.com/40x40/667eea/ffffff?text=CA",
    websiteUrl: "https://example.com/coding-ai",
    category: "Coding",
    about: "Intelligent coding assistant that helps developers write better code.",
    keywords: ["coding", "programming", "ai", "developer", "code"],
    toolType: "browser",
    likeCount: 18,
    saveCount: 10
  },
  {
    title: "Test Video Editor",
    logoUrl: "https://via.placeholder.com/40x40/667eea/ffffff?text=VE",
    websiteUrl: "https://example.com/video-ai",
    category: "Video",
    about: "AI-powered video editing tool for creating professional content.",
    keywords: ["video", "editing", "ai", "content", "media"],
    toolType: "downloadable",
    likeCount: 25,
    saveCount: 15
  },
  {
    title: "Test Image Generator",
    logoUrl: "https://via.placeholder.com/40x40/667eea/ffffff?text=IG",
    websiteUrl: "https://example.com/image-ai",
    category: "Image",
    about: "Generate stunning images using artificial intelligence.",
    keywords: ["image", "generation", "ai", "art", "visual"],
    toolType: "browser",
    likeCount: 30,
    saveCount: 20
  }
];

const TEST_CATEGORIES = [
  "Writing",
  "Design", 
  "Coding",
  "Video",
  "Image",
  "Audio",
  "Productivity",
  "Marketing",
  "Education",
  "Business"
];

// Tool Schema (simplified for CommonJS)
const toolSchema = new mongoose.Schema({
  title: { type: String, required: true },
  logoUrl: { type: String, required: true },
  websiteUrl: { type: String, required: true },
  category: { type: String, required: true },
  about: { type: String, required: true },
  keywords: [{ type: String }],
  toolType: { type: String, enum: ['browser', 'downloadable'], default: 'browser' },
  likeCount: { type: Number, default: 0 },
  saveCount: { type: Number, default: 0 }
}, { timestamps: true });

// User Schema (simplified for CommonJS)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  clerkId: { type: String, required: true },
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  folders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }],
  savedTools: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tool' }],
  likedTools: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tool' }],
  isSubscribed: { type: Boolean, default: false },
  planAmount: { type: Number, default: 0 },
  toolLimit: { type: Number, default: 20 },
  folderLimit: { type: Number, default: 3 },
  paymentHistory: [{ type: mongoose.Schema.Types.Mixed }]
}, { timestamps: true });

async function seedTestData() {
  try {
    console.log('🌱 Starting test data seeding...');
    
    // Check if environment variables are available
    if (!process.env.MONGODB_URI_TOOLS || !process.env.MONGODB_URI_USERS) {
      console.log('⚠️ Environment variables not available, using fallback values for test data seeding');
      // Use fallback values for testing
      process.env.MONGODB_URI_TOOLS = process.env.MONGODB_URI_TOOLS || 'mongodb+srv://aiwebsitedata:sb2MDSHbOuDSdRXK@cluster0.eezjwk1.mongodb.net/aifindertools?retryWrites=true&w=majority';
      process.env.MONGODB_URI_USERS = process.env.MONGODB_URI_USERS || 'mongodb+srv://AifinderSaas:R3altIme5AAs@cluster0.vkgdjmz.mongodb.net/SaasDB?retryWrites=true&w=majority';
    }
    
    // Connect to tools database
    const toolsConnection = await mongoose.createConnection(process.env.MONGODB_URI_TOOLS);
    const Tool = toolsConnection.model('Tool', toolSchema);
    
    // Connect to user database
    const usersConnection = await mongoose.createConnection(process.env.MONGODB_URI_USERS);
    const User = usersConnection.model('User', userSchema);
    
    // Clear existing test data
    console.log('🧹 Clearing existing test data...');
    await Tool.deleteMany({ title: { $regex: /^Test / } });
    
    // Insert test tools
    console.log('📝 Inserting test tools...');
    const insertedTools = await Tool.insertMany(TEST_TOOLS);
    console.log(`✅ Inserted ${insertedTools.length} test tools`);
    
    // Create test categories by ensuring we have tools in each category
    console.log('📂 Creating test categories...');
    for (const category of TEST_CATEGORIES) {
      const existingTool = await Tool.findOne({ category });
      if (!existingTool) {
        await Tool.create({
          title: `Test ${category} Tool`,
          logoUrl: `https://via.placeholder.com/40x40/667eea/ffffff?text=${category.charAt(0)}`,
          websiteUrl: `https://example.com/${category.toLowerCase()}-ai`,
          category,
          about: `Test AI tool for ${category.toLowerCase()} category.`,
          keywords: [category.toLowerCase(), "ai", "test", "tool", "category"],
          toolType: "browser",
          likeCount: Math.floor(Math.random() * 20) + 5,
          saveCount: Math.floor(Math.random() * 10) + 2
        });
      }
    }
    
    // Create test user if it doesn't exist
    console.log('👤 Creating test user...');
    const testUserEmail = 'test@example.com';
    const existingUser = await User.findOne({ email: testUserEmail });
    
    if (!existingUser) {
      await User.create({
        email: testUserEmail,
        clerkId: 'test_clerk_id_123',
        name: 'Test User',
        isActive: true,
        folders: [],
        savedTools: [],
        likedTools: [],
        isSubscribed: false,
        planAmount: 0,
        toolLimit: 20,
        folderLimit: 3,
        paymentHistory: []
      });
      console.log('✅ Created test user');
    } else {
      console.log('✅ Test user already exists');
    }
    
    // Close connections
    await toolsConnection.close();
    await usersConnection.close();
    
    console.log('🎉 Test data seeding completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    return false;
  }
}

async function cleanupTestData() {
  try {
    console.log('🧹 Cleaning up test data...');
    
    // Check if environment variables are available
    if (!process.env.MONGODB_URI_TOOLS || !process.env.MONGODB_URI_USERS) {
      console.log('⚠️ Environment variables not available, skipping test data cleanup');
      return true; // Return true to continue with tests
    }
    
    // Connect to tools database
    const toolsConnection = await mongoose.createConnection(process.env.MONGODB_URI_TOOLS);
    const Tool = toolsConnection.model('Tool', toolSchema);
    
    // Connect to user database
    const usersConnection = await mongoose.createConnection(process.env.MONGODB_URI_USERS);
    const User = usersConnection.model('User', userSchema);
    
    // Remove test tools
    await Tool.deleteMany({ title: { $regex: /^Test / } });
    
    // Remove test user
    await User.deleteOne({ email: 'test@example.com' });
    
    // Close connections
    await toolsConnection.close();
    await usersConnection.close();
    
    console.log('✅ Test data cleanup completed');
    return true;
    
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
    return false;
  }
}

module.exports = {
  seedTestData,
  cleanupTestData
}; 