// ////////////////////////////////////////////////////////////////////////////////
// // 🛑 Nothing in here has anything to do with Nextjs, it's just a fake database
// ////////////////////////////////////////////////////////////////////////////////

// import { faker } from '@faker-js/faker';
// import { matchSorter } from 'match-sorter'; // For filtering
// import { getAllUsers } from '@/utils/user';
// import Cookies from "universal-cookie";

// const cookies = new Cookies();
// const data = cookies.get('user')

// // Define the shape of User data

// type Gender = 'male' | 'female';

// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// export type User = {
//   _id: string;
//   firstname: string;
//   lastname: string;
//   email: string;
//   phoneNumber: string;
// };

// // Mock user data store
// export const allUsers = {
//   records: [] as User[], // Holds the list of user objects
//   // Initialize with sample data
//   async initialize(token: string) {
//     try {
//       const response = await getAllUsers(2,token); // Call the API and wait for the response
//       console.log(response.users);

//       // Assign the fetched users to `records`
//       this.records = response?.users || [];
//     } catch (error) {
//       console.error("Failed to fetch users:", error);
//     }
//   },

//   // Get all users with optional gender filtering and search
//   async getAll({
//     search
//   }: {
//     genders?: string[];
//     search?: string;
//   }) {
//     let users = [...this.records];

//     // Search functionality across multiple fields
//     if (search) {
//       users = matchSorter(users, search, {
//         keys: [
//           'firstname',
//           'lastname',
//           'email',
//         ]
//       });
//     }
//     return users;
//   },

//   // Get paginated results with optional gender filtering and search
//   async getUsers({
//     page = 1,
//     limit = 10,
//     search
//   }: {
//     page?: number;
//     limit?: number;
//     search?: string;
//   }) {
//     const allUsers = await this.getAll({ search });
//     const totalUsers = allUsers.length;

//     // Pagination logic
//     const offset = (page - 1) * limit;
//     const paginatedUsers = allUsers.slice(offset, offset + limit);

//     // Mock current time
//     const currentTime = new Date().toISOString();

//     // Return paginated response
//     return {
//       success: true,
//       total_users: totalUsers,
//       offset,
//       limit,
//       users: paginatedUsers
//     };
//   }
// };

// // Initialize sample users
// const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NmM3MzM2NzdjNGM4MDA4OTlhYzMxMCIsInRva2VuVHlwZSI6ImFjY2VzcyIsImlhdCI6MTczNTI4Mzk0OCwiZXhwIjoxNzY2Mzg3OTQ4LCJhdWQiOiJyb290IiwiaXNzIjoidGVzdGFkbWlAbWVoY2hhbnQuY29tIiwic3ViIjoidGVzdGFkbWlAbWVoY2hhbnQuY29tIn0.hkTQFP9hFxn1dMD2rO45FQ8TLwcXZxtEzaPFO_iW4Go"
// allUsers.initialize(token);

// // Define the shape of Product data
// export type Product = {
//   photo_url: string;
//   name: string;
//   description: string;
//   created_at: string;
//   price: number;
//   id: number;
//   category: string;
//   updated_at: string;
// };

// // Mock product data store
// export const fakeProducts = {
//   records: [] as Product[], // Holds the list of product objects

//   // Initialize with sample data
//   initialize() {
//     const sampleProducts: Product[] = [];
//     function generateRandomProductData(id: number): Product {
//       const categories = [
//         'Electronics',
//         'Furniture',
//         'Clothing',
//         'Toys',
//         'Groceries',
//         'Books',
//         'Jewelry',
//         'Beauty Products'
//       ];

//       return {
//         id,
//         name: faker.commerce.productName(),
//         description: faker.commerce.productDescription(),
//         created_at: faker.date
//           .between({ from: '2022-01-01', to: '2023-12-31' })
//           .toISOString(),
//         price: parseFloat(faker.commerce.price({ min: 5, max: 500, dec: 2 })),
//         photo_url: `https://api.slingacademy.com/public/sample-products/${id}.png`,
//         category: faker.helpers.arrayElement(categories),
//         updated_at: faker.date.recent().toISOString()
//       };
//     }

//     // Generate remaining records
//     for (let i = 1; i <= 20; i++) {
//       sampleProducts.push(generateRandomProductData(i));
//     }

//     this.records = sampleProducts;
//   },

//   // Get all products with optional category filtering and search
//   async getAll({
//     categories = [],
//     search
//   }: {
//     categories?: string[];
//     search?: string;
//   }) {
//     let products = [...this.records];

//     // Filter products based on selected categories
//     if (categories.length > 0) {
//       products = products.filter((product) =>
//         categories.includes(product.category)
//       );
//     }

//     // Search functionality across multiple fields
//     if (search) {
//       products = matchSorter(products, search, {
//         keys: ['name', 'description', 'category']
//       });
//     }

//     return products;
//   },

//   // Get paginated results with optional category filtering and search
//   async getProducts({
//     page = 1,
//     limit = 10,
//     categories,
//     search
//   }: {
//     page?: number;
//     limit?: number;
//     categories?: string;
//     search?: string;
//   }) {
//     await delay(1000);
//     const categoriesArray = categories ? categories.split('.') : [];
//     const allProducts = await this.getAll({
//       categories: categoriesArray,
//       search
//     });
//     const totalProducts = allProducts.length;

//     // Pagination logic
//     const offset = (page - 1) * limit;
//     const paginatedProducts = allProducts.slice(offset, offset + limit);

//     // Mock current time
//     const currentTime = new Date().toISOString();

//     // Return paginated response
//     return {
//       success: true,
//       time: currentTime,
//       message: 'Sample data for testing and learning purposes',
//       total_products: totalProducts,
//       offset,
//       limit,
//       products: paginatedProducts
//     };
//   },

//   // Get a specific product by its ID
//   async getProductById(id: number) {
//     await delay(1000); // Simulate a delay

//     // Find the product by its ID
//     const product = this.records.find((product) => product.id === id);

//     if (!product) {
//       return {
//         success: false,
//         message: `Product with ID ${id} not found`
//       };
//     }

//     // Mock current time
//     const currentTime = new Date().toISOString();

//     return {
//       success: true,
//       time: currentTime,
//       message: `Product with ID ${id} found`,
//       product
//     };
//   }
// };

// // Initialize sample products
// fakeProducts.initialize();
