resource "kubernetes_namespace" "cee-compiler" {
  metadata {
    name = "cee-compiler"
    labels = {
      name = "cee-compiler"
    }
  }
}

resource "kubernetes_config_map" "cee-compiler" {
  metadata {
    name      = "cee-compiler-configmap"
    namespace = "cee-compiler"
  }
  data = {
    CEE_COMPILER_QUEUE_NAME = "cee-compiler-queue"
    ENVIRONMENT             = "production"
  }
  depends_on = [
    kubernetes_namespace.cee-compiler
  ]
}

resource "kubernetes_secret" "cee-compiler" {
  metadata {
    name      = "cee-compiler-secrets"
    namespace = "cee-compiler"
  }
  data = {
    REDIS_HOST        = aws_elasticache_replication_group.algorint.primary_endpoint_address
    SUBMISSION_QUEUE  = aws_mq_broker.algorint-rabbitmq.instances[0].endpoints[0]
    RABBITMQ_USERNAME = var.rabbitmq-username
    RABBITMQ_PASSWORD = var.rabbitmq-password
  }
  type = "Opaque"
  depends_on = [
    kubernetes_namespace.cee-compiler
  ]
}

resource "kubernetes_deployment" "cee-compiler" {
  metadata {
    name      = "cee-compiler"
    namespace = "cee-compiler"
    labels = {
      app = "cee-compiler"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "cee-compiler"
      }
    }

    template {
      metadata {
        labels = {
          app = "cee-compiler"
        }
      }

      spec {
        node_selector = {
          "hostname" = "node2"
        }
        container {
          image = "docker:dind"
          name  = "docker"
          security_context {
            privileged = true
          }
          volume_mount {
            name       = "dockersock"
            mount_path = "/var/run/"
          }
          volume_mount {
            name       = "code"
            mount_path = "/app/code"
          }
          resources {
            limits = {
              cpu    = "0.3"
              memory = "200Mi"
            }
            requests = {
              cpu    = "0.3"
              memory = "200Mi"
            }
          }
        }
        container {
          image             = "chan1992241/cee-compiler:latest"
          name              = "cee-compiler"
          image_pull_policy = "Always"
          resources {
            limits = {
              cpu    = "0.1"
              memory = "50Mi"
            }
            requests = {
              cpu    = "0.1"
              memory = "50Mi"
            }
          }
          env_from {
            config_map_ref {
              name = "cee-compiler-configmap"
            }
          }
          env_from {
            secret_ref {
              name = "cee-compiler-secrets"
            }
          }
          volume_mount {
            name       = "dockersock"
            mount_path = "/var/run/"
          }
          volume_mount {
            name       = "code"
            mount_path = "/app/code"
          }
        }
        volume {
          name = "dockersock"
          empty_dir {}
        }
        volume {
          name = "code"
          empty_dir {}
        }

      }
    }
  }
  depends_on = [
    kubernetes_config_map.cee-compiler,
    kubernetes_secret.cee-compiler,
    kubernetes_namespace.cee-compiler
  ]
}
