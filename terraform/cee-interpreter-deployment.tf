resource "kubernetes_namespace" "cee-interpreter" {
  metadata {
    name = "cee-interpreter"
    labels = {
      name = "cee-interpreter"
    }
  }
}

resource "kubernetes_config_map" "cee-interpreter" {
  metadata {
    name      = "cee-interpreter-configmap"
    namespace = "cee-interpreter"
  }
  data = {
    CEE_INTERPRETER_QUEUE_NAME = "cee-intrepreter-queue"
    ENVIRONMENT                = "production"
  }
  depends_on = [
    kubernetes_namespace.cee-interpreter
  ]
}

resource "kubernetes_secret" "cee-interpreter" {
  metadata {
    name      = "cee-interpreter-secrets"
    namespace = "cee-interpreter"
  }
  data = {
    REDIS_HOST        = aws_elasticache_replication_group.algorint.primary_endpoint_address
    SUBMISSION_QUEUE  = aws_mq_broker.algorint-rabbitmq.instances[0].endpoints[0]
    RABBITMQ_USERNAME = var.rabbitmq-username
    RABBITMQ_PASSWORD = var.rabbitmq-password
  }
  type = "Opaque"
  depends_on = [
    kubernetes_namespace.cee-interpreter
  ]
}

resource "kubernetes_deployment" "cee-interpreter" {
  metadata {
    name      = "cee-interpreter"
    namespace = "cee-interpreter"
    labels = {
      app = "cee-interpreter"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "cee-interpreter"
      }
    }

    template {
      metadata {
        labels = {
          app = "cee-interpreter"
        }
      }

      spec {
        node_selector = {
          "hostname" = "node2"
        }
        container {
          image             = "chan1992241/cee-interpreter:latest"
          name              = "cee-interpreter"
          image_pull_policy = "Always"
          resources {
            limits = {
              cpu    = "100m"
              memory = "100Mi"
            }
            requests = {
              cpu    = "100m"
              memory = "100Mi"
            }
          }
          env_from {
            config_map_ref {
              name = "cee-interpreter-configmap"
            }
          }
          env_from {
            secret_ref {
              name = "cee-interpreter-secrets"
            }
          }
        }
      }
    }
  }
  depends_on = [
    kubernetes_config_map.cee-interpreter,
    kubernetes_secret.cee-interpreter
    kubernetes_namespace.cee-interpreter
  ]
}
