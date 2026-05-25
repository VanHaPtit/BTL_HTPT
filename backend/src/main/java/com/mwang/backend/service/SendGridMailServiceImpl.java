package com.mwang.backend.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import com.sendgrid.helpers.mail.objects.Personalization;
import com.mwang.backend.domain.model.EmailRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class SendGridMailServiceImpl implements SendGridMailService {

    @Value("${send_grid.api_key:}")
    private String sendGridApiKey;

    @Value("${send_grid.from_email:}")
    private String sendGridFromEmail;

    @Value("${send_grid.from_name:}")
    private String sendGridFromName;

    @Override
    public void sendMail(EmailRequest emailRequest) {
        Mail mail = buildMail(emailRequest);
        send(mail);
    }

    private Mail buildMail(EmailRequest request) {
        Mail mail = new Mail();

        Email from = new Email();
        from.setName(sendGridFromName);
        from.setEmail(sendGridFromEmail);
        mail.setFrom(from);

        mail.setSubject(request.getSubject());

        Personalization personalization = new Personalization();
        Email to = new Email();
        to.setEmail(request.getToEmail());
        personalization.addTo(to);
        mail.addPersonalization(personalization);

        Content content = new Content();
        content.setType("text/plain");
        content.setValue(request.getContent());
        mail.addContent(content);

        return mail;
    }

    private void send(Mail mail) {
        SendGrid sg = new SendGrid(sendGridApiKey);
        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            System.out.println("Status Code: " + response.getStatusCode());
            if (response.getStatusCode() >= 400) {
                System.out.println("Error Body: " + response.getBody());
            }
        } catch (IOException ex) {
            ex.printStackTrace();
        }
    }
}
