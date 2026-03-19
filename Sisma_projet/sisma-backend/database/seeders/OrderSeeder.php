<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\OrderItem;
use Carbon\Carbon;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $orders = [
            // Orders from the last 7 days
            [
                'customer_name' => 'Konan Jean',
                'customer_phone' => '+2250700000001',
                'customer_location' => 'Abidjan, Côte d\'Ivoire',
                'commune' => 'Cocody',
                'quartier' => ' Deux-Plateaux',
                'delivery_type' => 'standard',
                'delivery_date' => Carbon::now()->addDays(2),
                'subtotal' => 150000,
                'delivery_fee' => 2000,
                'total' => 152000,
                'status' => 'delivered',
                'created_at' => Carbon::now()->subDays(1),
            ],
            [
                'customer_name' => 'Doumbia Amara',
                'customer_phone' => '+2250700000002',
                'customer_location' => 'Abidjan, Côte d\'Ivoire',
                'commune' => 'Yopougon',
                'quartier' => 'Sicogi',
                'delivery_type' => 'express',
                'delivery_date' => Carbon::now()->addDays(1),
                'subtotal' => 250000,
                'delivery_fee' => 5000,
                'total' => 255000,
                'status' => 'shipped',
                'created_at' => Carbon::now()->subDays(2),
            ],
            [
                'customer_name' => 'Traoré Fatou',
                'customer_phone' => '+2250700000003',
                'customer_location' => 'Abidjan, Côte d\'Ivoire',
                'commune' => 'Marcory',
                'quartier' => 'Biétry',
                'delivery_type' => 'standard',
                'delivery_date' => Carbon::now()->addDays(3),
                'subtotal' => 85000,
                'delivery_fee' => 2000,
                'total' => 87000,
                'status' => 'pending',
                'created_at' => Carbon::now()->subDays(3),
            ],
            [
                'customer_name' => 'Koffi Cyrille',
                'customer_phone' => '+2250700000004',
                'customer_location' => 'Abidjan, Côte d\'Ivoire',
                'commune' => 'Treichville',
                'quartier' => 'Carrefour',
                'delivery_type' => 'standard',
                'delivery_date' => Carbon::now()->addDays(2),
                'subtotal' => 45000,
                'delivery_fee' => 1500,
                'total' => 46500,
                'status' => 'delivered',
                'created_at' => Carbon::now()->subDays(4),
            ],
            [
                'customer_name' => 'Bamba Youssouf',
                'customer_phone' => '+2250700000005',
                'customer_location' => 'Abidjan, Côte d\'Ivoire',
                'commune' => 'Plateau',
                'quartier' => 'Cité Administrative',
                'delivery_type' => 'express',
                'delivery_date' => Carbon::now()->addDays(1),
                'subtotal' => 180000,
                'delivery_fee' => 5000,
                'total' => 185000,
                'status' => 'shipped',
                'created_at' => Carbon::now()->subDays(5),
            ],
            [
                'customer_name' => 'Konan Aya',
                'customer_phone' => '+2250700000006',
                'customer_location' => 'Abidjan, Côte d\'Ivoire',
                'commune' => 'Koumassi',
                'quartier' => 'Remblais',
                'delivery_type' => 'standard',
                'delivery_date' => Carbon::now()->addDays(3),
                'subtotal' => 65000,
                'delivery_fee' => 2000,
                'total' => 67000,
                'status' => 'pending',
                'created_at' => Carbon::now()->subDays(6),
            ],
            [
                'customer_name' => 'Soro Blé',
                'customer_phone' => '+2250700000007',
                'customer_location' => 'Abidjan, Côte d\'Ivoire',
                'commune' => 'Port-Bouët',
                'quartier' => 'Vridi',
                'delivery_type' => 'standard',
                'delivery_date' => Carbon::now()->addDays(2),
                'subtotal' => 95000,
                'delivery_fee' => 2000,
                'total' => 97000,
                'status' => 'delivered',
                'created_at' => Carbon::now()->subDays(7),
            ],
            [
                'customer_name' => 'N\'Goran Kouadio',
                'customer_phone' => '+2250700000008',
                'customer_location' => 'Abidjan, Côte d\'Ivoire',
                'commune' => 'Abobo',
                'quartier' => 'Slemm',
                'delivery_type' => 'express',
                'delivery_date' => Carbon::now()->addDays(1),
                'subtotal' => 350000,
                'delivery_fee' => 5000,
                'total' => 355000,
                'status' => 'shipped',
                'created_at' => Carbon::now()->subDays(8),
            ],
            [
                'customer_name' => 'Kouassi René',
                'customer_phone' => '+2250700000009',
                'customer_location' => 'Abidjan, Côte d\'Ivoire',
                'commune' => 'Attécoubé',
                'quartier' => 'Adjamé',
                'delivery_type' => 'standard',
                'delivery_date' => Carbon::now()->addDays(3),
                'subtotal' => 55000,
                'delivery_fee' => 1500,
                'total' => 56500,
                'status' => 'delivered',
                'created_at' => Carbon::now()->subDays(9),
            ],
            [
                'customer_name' => 'Boli Marie',
                'customer_phone' => '+2250700000010',
                'customer_location' => 'Abidjan, Côte d\'Ivoire',
                'commune' => 'Yopougon',
                'quartier' => 'Niangon',
                'delivery_type' => 'standard',
                'delivery_date' => Carbon::now()->addDays(2),
                'subtotal' => 125000,
                'delivery_fee' => 2000,
                'total' => 127000,
                'status' => 'pending',
                'created_at' => Carbon::now()->subDays(10),
            ],
        ];

        $products = \App\Models\Product::all();
        
        foreach ($orders as $orderData) {
            $order = Order::create([
                'customer_name' => $orderData['customer_name'],
                'customer_phone' => $orderData['customer_phone'],
                'customer_location' => $orderData['customer_location'],
                'commune' => $orderData['commune'],
                'quartier' => $orderData['quartier'],
                'delivery_type' => $orderData['delivery_type'],
                'delivery_date' => $orderData['delivery_date'],
                'subtotal' => $orderData['subtotal'],
                'delivery_fee' => $orderData['delivery_fee'],
                'total' => $orderData['total'],
                'status' => $orderData['status'],
                'created_at' => $orderData['created_at'],
            ]);
            
            // Add 1-3 random order items
            $numItems = rand(1, 3);
            $randomProducts = $products->random($numItems);
            
            foreach ($randomProducts as $product) {
                $quantity = rand(1, 3);
                $price = $product->price;
                
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'supplier_id' => $product->supplier_id,
                    'quantity' => $quantity,
                    'price' => $price,
                    'total' => $price * $quantity,
                ]);
            }
        }
        
        $this->command->info("Created " . count($orders) . " orders successfully!");
    }
}
