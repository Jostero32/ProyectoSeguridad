package com.seguridad.Messenger.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class StorageConfig {

    private final StorageProperties props;

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(props.getEndpoint())
                .credentials(props.getAccessKey(), props.getSecretKey())
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "storage.init.enabled", havingValue = "true", matchIfMissing = true)
    public ApplicationRunner initBuckets(MinioClient minioClient) {
        return args -> {
            crearBucketSiNoExiste(minioClient, props.getBucket(), false);
            crearBucketSiNoExiste(minioClient, props.getBucketAvatars(), true);
        };
    }

    private void crearBucketSiNoExiste(MinioClient client, String bucket, boolean publico) throws Exception {
        boolean existe = client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
        if (existe) return;

        client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
        if (publico) {
            String policy = """
                    {"Version":"2012-10-17","Statement":[{"Effect":"Allow",\
                    "Principal":{"AWS":["*"]},"Action":["s3:GetObject"],\
                    "Resource":["arn:aws:s3:::%s/*"]}]}""".formatted(bucket);
            client.setBucketPolicy(SetBucketPolicyArgs.builder().bucket(bucket).config(policy).build());
            log.info("Bucket '{}' creado (publico de solo lectura)", bucket);
        } else {
            log.info("Bucket '{}' creado (privado)", bucket);
        }
    }
}
