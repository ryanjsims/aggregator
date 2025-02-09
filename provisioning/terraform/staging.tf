# module "aggregator_staging" {
#   source                   = "./modules/aggregator"
#   namespace                = "ps2alerts"
#   environment              = "staging"
#   identifier               = "ps2alerts-aggregator-staging"
#   checksum_version         = var.checksum_version
#   database_user            = var.db_user
#   database_pass            = var.db_pass
#   database_host            = "ps2alerts-db"
#   database_port            = 27017
#   database_name            = "ps2alerts-staging"
#   database_pool_size       = 20
#   database_debug           = false
#   redis_host               = "ps2alerts-redis-master"
#   redis_pass               = var.redis_pass
#   redis_db                 = 10
#   rabbitmq_host            = "ps2alerts-rabbitmq"
#   rabbitmq_user            = "ps2alerts"
#   rabbitmq_pass            = var.rabbitmq_pass
#   rabbitmq_api_queue       = "api-queue-staging"
#   rabbitmq_api_queue_delay = "api-queue-delay-staging"
#   census_service_id        = var.census_service_id
#   cpu_limit                = "300m"
#   mem_limit                = "0.15Gi"
#   cpu_request              = "50m"
#   mem_request              = "0.15Gi"
#   discord_webhook          = "https://discordapp.com/api/webhooks/736389415936720917/RkeDsvhGFjq3HSewPU_q59Et-6cHKCdkISw7apatWF8mJFc0w48YH88-_pG9hh03ljJ6"
#   logger_transports        = "console,discord"
#   dd_api_key               = var.dd_api_key
#   dd_app_key               = var.dd_app_key
# }
