resource "kubernetes_namespace" "client" {
  metadata {
    name = "client"
    labels = {
      name = "client"
    }
  }
}

resource "kubernetes_config_map" "client" {
  metadata {
    name      = "client-configmap"
    namespace = "client"
  }
  data = {
    MONGO_URI  = aws_docdb_cluster.algorint.endpoint
    ROUTER_URL = "http://router-service.router.svc.cluster.local:80"
    ENV        = "production"
  }
  depends_on = [
    kubernetes_config_map.client
  ]
}

resource "kubernetes_secret" "client" {
  metadata {
    name      = "client-secrets"
    namespace = "client"
  }
  data = {
    GOOGLE_CLIENT_ID     = "OTEyMDUxOTU4Mzc1LWphMnE4NjBudGMxOGl1MXJ2aHNkcHI4b2kybjVxbmt1LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29t"
    GOOGLE_CLIENT_SECRET = var.GOOGLE_CLIENT_SECRET
    MONGO_PASSWORD       = "YWxnb3JpbnQtbW9uZ29kYi1wYXNzd29yZA=="
    MONGO_USER           = "YWxnb3JpbnQ="
  }
  depends_on = [
    kubernetes_config_map.client
  ]
  type = "Opaque"
}

resource "kubernetes_deployment" "client" {
  metadata {
    name      = "client-app"
    namespace = "client"
    labels = {
      app = "client-app"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "client-app"
      }
    }

    template {
      metadata {
        labels = {
          app = "client-app"
        }
      }

      spec {
        node_selector = {
          "hostname" = "node1"
        }
        container {
          image             = "chan1992241/client"
          name              = "client-app"
          image_pull_policy = "Always"
          #   args              = ["wget", "https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem"]
          resources {
            limits = {
              cpu    = "0.5"
              memory = "800Mi"
            }
            requests = {
              cpu    = "0.5"
              memory = "800Mi"
            }
          }
          env_from {
            config_map_ref {
              name = "client-configmap"
            }
          }
          env_from {
            secret_ref {
              name = "client-secrets"
            }
          }
          port {
            container_port = 3000
            name           = "http"
            protocol       = "TCP"
          }
        }
      }
    }
  }
  depends_on = [
    kubernetes_config_map.client,
    kubernetes_secret.client
  ]
}

resource "kubernetes_service" "client" {
  metadata {
    name      = "client-app"
    namespace = "client"
    labels = {
      app = "client-app"
    }
  }
  spec {
    selector = {
      app = "client-app"
    }
    port {
      port        = 80
      target_port = 3000
      protocol    = "TCP"
    }
    type = "LoadBalancer"
  }
  depends_on = [
    kubernetes_config_map.client
  ]
}
