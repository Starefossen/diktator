# Use distroless image for minimal size and security
FROM gcr.io/distroless/static-debian12:nonroot

# Use build argument to specify target architecture
ARG TARGETARCH=amd64

# Copy the pre-built binary for the target architecture
COPY bin/server-linux-${TARGETARCH} /app/server

# Set working directory
WORKDIR /app

# Expose port
EXPOSE 8080

# Run the application as non-root user (built into distroless:nonroot)
CMD ["./server"]
