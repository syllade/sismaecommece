<?php

/**
 * Redis High Availability Configuration
 * 
 * Supports:
 * - Sentinel for automatic failover
 * - Cluster mode for horizontal scaling
 * - Separate connections for cache, sessions, queues
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Redis Connection Type
    |--------------------------------------------------------------------------
    |
    | 'standalone' - Single Redis instance
    | 'sentinel'   - Redis Sentinel for failover
    | 'cluster'    - Redis Cluster for scaling
    |
    */
    'type' => env('REDIS_TYPE', 'sentinel'),

    /*
    |--------------------------------------------------------------------------
    | Standalone Redis Configuration
    |--------------------------------------------------------------------------
    */
    'default' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD', null),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_DB', '0'),
        'read_timeout' => 60,
        'prefix' => env('REDIS_PREFIX', 'fashop_'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Redis Sentinel Configuration
    |--------------------------------------------------------------------------
    */
    'sentinel' => [
        'master_name' => env('REDIS_SENTINEL_MASTER', 'fashop-master'),
        
        // Sentinel instances
        'sentinels' => [
            env('REDIS_SENTINEL_1', '127.0.0.1:26379'),
            env('REDIS_SENTINEL_2', '127.0.0.1:26380'),
            env('REDIS_SENTINEL_3', '127.0.0.1:26381'),
        ],
        
        'options' => [
            'reconnect' => 10,
            'retry_interval' => 100,
            'read_timeout' => 60,
            'prefix' => env('REDIS_PREFIX', 'fashop_'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Redis Cluster Configuration
    |--------------------------------------------------------------------------
    */
    'cluster' => [
        'hosts' => [
            ['host' => env('REDIS_CLUSTER_HOST_1', '127.0.0.1'), 'port' => env('REDIS_CLUSTER_PORT_1', '7001')],
            ['host' => env('REDIS_CLUSTER_HOST_2', '127.0.0.1'), 'port' => env('REDIS_CLUSTER_PORT_2', '7002')],
            ['host' => env('REDIS_CLUSTER_HOST_3', '127.0.0.1'), 'port' => env('REDIS_CLUSTER_PORT_3', '7003')],
            ['host' => env('REDIS_CLUSTER_HOST_4', '127.0.0.1'), 'port' => env('REDIS_CLUSTER_PORT_4', '7004')],
            ['host' => env('REDIS_CLUSTER_HOST_5', '127.0.0.1'), 'port' => env('REDIS_CLUSTER_PORT_5', '7005')],
        ],
        
        'options' => [
            'cluster' => 'redis',
            'prefix' => env('REDIS_PREFIX', 'fashop_'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Separate Redis Connections for Different Use Cases
    |--------------------------------------------------------------------------
    */

    // Cache - High volume, can tolerate some data loss
    'cache' => [
        'host' => env('REDIS_CACHE_HOST', '127.0.0.1'),
        'password' => env('REDIS_CACHE_PASSWORD', null),
        'port' => env('REDIS_CACHE_PORT', '6379'),
        'database' => env('REDIS_CACHE_DB', '1'),
        'read_timeout' => 60,
        'prefix' => env('REDIS_CACHE_PREFIX', 'cache_'),
    ],

    // Sessions - Must be persistent, reliable
    'sessions' => [
        'host' => env('REDIS_SESSION_HOST', '127.0.0.1'),
        'password' => env('REDIS_SESSION_PASSWORD', null),
        'port' => env('REDIS_SESSION_PORT', '6379'),
        'database' => env('REDIS_SESSION_DB', '2'),
        'read_timeout' => 60,
        'prefix' => env('REDIS_SESSION_PREFIX', 'session_'),
    ],

    // Queue - Must be reliable, ordered
    'queue' => [
        'host' => env('REDIS_QUEUE_HOST', '127.0.0.1'),
        'password' => env('REDIS_QUEUE_PASSWORD', null),
        'port' => env('REDIS_QUEUE_PORT', '6379'),
        'database' => env('REDIS_QUEUE_DB', '3'),
        'read_timeout' => 60,
        'prefix' => env('REDIS_QUEUE_PREFIX', 'queue_'),
    ],

    // Real-time / Pusher - Low latency, ephemeral
    'realtime' => [
        'host' => env('REDIS_REALTIME_HOST', '127.0.0.1'),
        'password' => env('REDIS_REALTIME_PASSWORD', null),
        'port' => env('REDIS_REALTIME_PORT', '6379'),
        'database' => env('REDIS_REALTIME_DB', '4'),
        'read_timeout' => 5,
        'prefix' => env('REDIS_REALTIME_PREFIX', 'rt_'),
    ],

    // Rate limiting - Fast access, no persistence needed
    'ratelimit' => [
        'host' => env('REDIS_RATELIMIT_HOST', '127.0.0.1'),
        'password' => env('REDIS_RATELIMIT_PASSWORD', null),
        'port' => env('REDIS_RATELIMIT_PORT', '6379'),
        'database' => env('REDIS_RATELIMIT_DB', '5'),
        'read_timeout' => 5,
        'prefix' => env('REDIS_RATELIMIT_PREFIX', 'rl_'),
    ],

    // Events / Streams - For event-driven architecture
    'streams' => [
        'host' => env('REDIS_STREAMS_HOST', '127.0.0.1'),
        'password' => env('REDIS_STREAMS_PASSWORD', null),
        'port' => env('REDIS_STREAMS_PORT', '6379'),
        'database' => env('REDIS_STREAMS_DB', '6'),
        'read_timeout' => 60,
        'prefix' => env('REDIS_STREAMS_PREFIX', 'stream_'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Connection Pool Settings
    |--------------------------------------------------------------------------
    */
    'pool' => [
        'max_connections' => env('REDIS_POOL_MAX', 100),
        'min_connections' => env('REDIS_POOL_MIN', 10),
    ],

    /*
    |--------------------------------------------------------------------------
    | Failover Settings
    |--------------------------------------------------------------------------
    */
    'failover' => [
        'enabled' => env('REDIS_FAILOVER_ENABLED', true),
        'max_retries' => env('REDIS_FAILOVER_MAX_RETRIES', 3),
        'retry_delay' => env('REDIS_FAILOVER_RETRY_DELAY', 500),
    ],
];
