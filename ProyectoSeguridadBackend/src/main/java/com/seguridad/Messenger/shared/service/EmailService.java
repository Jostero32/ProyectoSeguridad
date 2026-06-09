package com.seguridad.Messenger.shared.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String from;

    /**
     * Envía un email con cuerpo HTML de forma asíncrona — usa el pool de hilos
     * configurado en {@code AsyncConfig}. Los errores se loggean pero no se
     * propagan al thread del request, lo cual es necesario en flujos como
     * "forgot-password" donde la latencia del SMTP no debe revelar si el
     * correo existe o no.
     */
    @Async
    public void enviarHtml(String para, String asunto, String cuerpoHtml) {
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, "UTF-8");
            helper.setFrom(from);
            helper.setTo(para);
            helper.setSubject(asunto);
            helper.setText(cuerpoHtml, true);
            mailSender.send(mime);
            log.info("Email enviado a {} (asunto: {})", para, asunto);
        } catch (MessagingException | MailException e) {
            log.error("Error enviando email a {}: {}", para, e.getMessage());
        }
    }
}
