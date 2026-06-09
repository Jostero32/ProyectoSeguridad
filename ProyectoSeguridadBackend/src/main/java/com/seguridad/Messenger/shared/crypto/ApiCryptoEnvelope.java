package com.seguridad.Messenger.shared.crypto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ApiCryptoEnvelope(
        @JsonProperty("ZW5jcnlwdGVk") boolean encrypted,
        @JsonProperty("dmVyc2lvbg")   String version,
        @JsonProperty("YWxn")         String alg,
        @JsonProperty("a2V5SWQ")      String keyId,
        @JsonProperty("aXY")          String iv,
        @JsonProperty("Y2lwaGVydGV4dA") String ciphertext
) {}
