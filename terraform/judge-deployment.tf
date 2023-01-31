resource "kubernetes_namespace" "judge" {
  metadata {
    name = "judge"
    labels = {
      name = "judge"
    }
  }
}

resource "kubernetes_config_map" "judge" {
  metadata {
    name      = "judge-configmap"
    namespace = "judge"
  }
  data = {
    ENVIRONMENT = "production"
  }
}

resource "kubernetes_secret" "judge" {
  metadata {
    name      = "judge-secrets"
    namespace = "judge"
  }
  data = {
    REDIS_HOST = aws_elasticache_replication_group.algorint.primary_endpoint_address
  }
  type = "Opaque"
}

resource "kubernetes_deployment" "judge" {
  metadata {
    name      = "judge"
    namespace = "judge"
    labels = {
      app = "judge"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "judge"
      }
    }

    template {
      metadata {
        labels = {
          app = "judge"
        }
      }

      spec {
        node_selector = {
          "hostname" = "node1"
        }
        container {
          image             = "chan1992241/judge:latest"
          name              = "judge"
          image_pull_policy = "Always"
          port {
            container_port = 8080
            name           = "http"
            protocol       = "TCP"
          }
          resources {
            limits = {
              cpu    = "500m"
              memory = "500Mi"
            }
            requests = {
              cpu    = "500m"
              memory = "500Mi"
            }
          }
          env_from {
            config_map_ref {
              name = "judge-configmap"
            }
          }
          env_from {
            secret_ref {
              name = "judge-secrets"
            }
          }
        }
      }
    }
  }
  depends_on = [
    kubernetes_config_map.judge,
    kubernetes_secret.judge
  ]
}

resource "kubernetes_service" "judge" {
  metadata {
    name      = "judge"
    namespace = "judge"
    labels = {
      app = "judge"
    }
  }
  spec {
    selector = {
      app = "judge"
    }
    type = "ClusterIP"
    port {
      name        = "http"
      protocol    = "TCP"
      port        = 80
      target_port = 8080
    }
  }
}
