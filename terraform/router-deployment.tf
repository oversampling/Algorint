resource "kubernetes_namespace" "router" {
  metadata {
    name = "router"
    labels = {
      name = "router"
    }
  }
}

resource "kubernetes_config_map" "router" {
  metadata {
    name      = "router-configmap"
    namespace = "router"
  }
  data = {
    CEE_INTERPRETER_QUEUE_NAME = "cee-intrepreter-queue"
    CEE_COMPILER_QUEUE_NAME    = "cee-compiler-queue"
    ENVIRONMENT                = "production"
  }
  depends_on = [
    kubernetes_config_map.router
  ]
}

resource "kubernetes_secret" "router" {
  metadata {
    name      = "router-secrets"
    namespace = "router"
  }
  data = {
    REDIS_HOST        = aws_elasticache_replication_group.algorint.primary_endpoint_address
    SUBMISSION_QUEUE  = aws_mq_broker.algorint-rabbitmq.instances[0].endpoints[0]
    RABBITMQ_USERNAME = var.rabbitmq-username
    RABBITMQ_PASSWORD = var.rabbitmq-password
  }
  depends_on = [
    kubernetes_config_map.router
  ]
  type = "Opaque"
}

resource "kubernetes_deployment" "router" {
  metadata {
    name      = "router-app"
    namespace = "router"
    labels = {
      app = "router-app"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "router-app"
      }
    }

    template {
      metadata {
        labels = {
          app = "router-app"
        }
      }

      spec {
        node_selector = {
          "hostname" = "node1"
        }
        container {
          image             = "chan1992241/router:latest"
          name              = "router-app"
          image_pull_policy = "Always"
          resources {
            limits = {
              cpu    = "0.5"
              memory = "200Mi"
            }
            requests = {
              cpu    = "0.5"
              memory = "200Mi"
            }
          }
          env_from {
            config_map_ref {
              name = "router-configmap"
            }
          }
          env_from {
            secret_ref {
              name = "router-secrets"
            }
          }
          port {
            container_port = 8080
            name           = "http"
            protocol       = "TCP"
          }
        }
      }
    }
  }
  depends_on = [
    kubernetes_config_map.router,
    kubernetes_secret.router
  ]
}

resource "kubernetes_service" "router" {
  metadata {
    name      = "router-app"
    namespace = "router"
    labels = {
      app = "router-app"
    }
  }
  spec {
    selector = {
      app = "router-app"
    }
    port {
      port        = 80
      target_port = 8080
      protocol    = "TCP"
    }
    type = "ClusterIP"
  }
  depends_on = [
    kubernetes_config_map.router
  ]
}
