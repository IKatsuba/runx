# `@nx-cloud/runners`

> **Attention is required!** This project is not an official [Nx Cloud](https://nx.app) service. This is an open-source alternative.

`@nx-cloud/runners` is a set of runners for Nx projects.

Now available 1 runner for caching build artifacts with S3 `@nx-cloud/runners/s3`

## `@nx-cloud/runners/s3`

### Configuring the S3 runner

The runner is configured in `nx.json`. Available all options of default runner configuration.

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "@nx-cloud/runners/s3",
      "options": {
        "cacheableOperations": [
          "build",
          "lint",
          "test",
          "e2e"
        ]
      }
    }
  }
}
```

Connection is configured using the `s3` option

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "@nx-cloud/runners/s3",
      "options": {
        "cacheableOperations": [
          "build",
          "lint",
          "test",
          "e2e"
        ],
        "s3": {
          "endpoint": "http://192.168.1.4:9000",
          "accessKeyId": "accessKeyId",
          "secretAccessKey": "secretAccessKey",
          "bucket": "bucket"
        }
      }
    }
  }
}
```
