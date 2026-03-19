<?php

/**
 * High Availability Database Configuration
 * 
 * Supports:
 * - Read Replica (load balancing for reads)
 * - Write Primary (for writes)
 * - Automatic failover
 * - Connection pooling
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Database Replication Mode
    |--------------------------------------------------------------------------
    |
    | 'none'     - Single database (no replication)
    | 'readonly' - Read from replica, write to primary
    | 'sharded'  - Horizontal sharding by supplier_id
    |
    */
    'replication_mode' => env('DB_REPLICATION_MODE', 'readonly'),

    /*
    |--------------------------------------------------------------------------
    | Read Replica Configuration
    |--------------------------------------------------------------------------
    */
    'read_replicas' => [
        [
            'host' => env('DB_REPLICA_HOST', '127.0.0.1'),
            'port' => env('DB_REPLICA_PORT', '3306'),
            'database' => env('DB_DATABASE', 'fashop'),
            'username' => env('DB_REPLICA_USERNAME', 'fashop'),
            'password' => env('DB_REPLICA_PASSWORD', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'strict' => true,
            'engine' => null,
            'options' => [
                \PDO::ATTR_TIMEOUT => 3,
            ],
        ],
        // Add more replicas as needed for horizontal scaling
        // [
        //     'host' => env('DB_REPLICA_HOST_2', '127.0.0.1'),
        //     ...
        // ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Write Primary Configuration
    |--------------------------------------------------------------------------
    */
    'write_primary' => [
        'host' => env('DB_HOST', '127.0.0.1'),
        'port' => env('DB_PORT', '3306'),
        'database' => env('DB_DATABASE', 'fashop'),
        'username' => env('DB_USERNAME', 'fashop'),
        'password' => env('DB_PASSWORD', ''),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix' => '',
        'strict' => true,
        'engine' => null,
    ],

    /*
    |--------------------------------------------------------------------------
    | Connection Pool Settings
    |--------------------------------------------------------------------------
    */
    'pool' => [
        'min_connections' => env('DB_POOL_MIN', 5),
        'max_connections' => env('DB_POOL_MAX', 50),
        'idle_timeout' => env('DB_POOL_IDLE', 600), // seconds
        'max_lifetime' => env('DB_POOL_LIFETIME', 1800), // seconds
    ],

    /*
    |--------------------------------------------------------------------------
    | Failover Configuration
    |--------------------------------------------------------------------------
    */
    'failover' => [
        'enabled' => env('DB_FAILOVER_ENABLED', true),
        'max_retries' => env('DB_FAILOVER_MAX_RETRIES', 3),
        'retry_delay' => env('DB_FAILOVER_RETRY_DELAY', 1000), // milliseconds
        'health_check_interval' => env('DB_FAILOVER_HEALTH_CHECK', 30), // seconds
    ],

    /*
    |--------------------------------------------------------------------------
    | Sticky Read/Write
    |--------------------------------------------------------------------------
    |
    | When enabled, reads after a write will go to the primary to ensure
    | data consistency. Disable for better performance but handle eventual
    | consistency in your application.
    |
    */
    'sticky' => env('DB_STICKY', true),

    /*
    |--------------------------------------------------------------------------
    | Query Routing Rules
    |--------------------------------------------------------------------------
    |
    | Define which queries should go to replica vs primary
    |
    */
    'routing' => [
        // Always use primary for these operations
        'always_primary' => [
            'insert',
            'update', 
            'delete',
            'alter',
            'create',
            'drop',
            'truncate',
        ],
        
        // Always use replica for these operations
        'always_replica' => [
            'select * from orders where id = ?', // After write, for consistency
        ],

        // Large query threshold - force replica for large reads
        'large_query_rows' => env('DB_LARGE_QUERY_ROWS', 10000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Sharding Configuration (for horizontal scaling)
    |--------------------------------------------------------------------------
    */
    'sharding' => [
        'enabled' => env('DB_SHARDING_ENABLED', false),
        
        // Shard by supplier_id
        'strategy' => 'supplier_id',
        
        // Number of shards
        'shard_count' => env('DB_SHARD_COUNT', 4),
        
        // Shard mapping
        'shards' => [
            [
                'id' => 0,
                'host' => env('DB_SHARD_0_HOST', '127.0.0.1'),
                'port' => env('DB_SHARD_0_PORT', '3306'),
                'database' => env('DB_SHARD_0_DATABASE', 'fashop_0'),
            ],
            [
                'id' => 1,
                'host' => env('DB_SHARD_1_HOST', '127.0.0.1'),
                'port' => env('DB_SHARD_1_PORT', '3307'),
                'database' => env('DB_SHARD_1_DATABASE', 'fashop_1'),
            ],
            [
                'id' => 2,
                'host' => env('DB_SHARD_2_HOST', '127.0.0.1'),
                'port' => env('DB_SHARD_2_PORT', '3308'),
                'database' => env('DB_SHARD_2_DATABASE', 'fashop_2'),
            ],
            [
                'id' => 3,
                'host' => env('DB_SHARD_3_HOST', '127.0.0.1'),
                'port' => env('DB_SHARD_3_PORT', '3309'),
                'database' => env('DB_SHARD_3_DATABASE', 'fashop_3'),
            ],
        ],
    ],
];
