package com.mwang.backend.service;

import com.mwang.backend.domain.model.EmailRequest;

public interface SendGridMailService {
    void sendMail(EmailRequest emailRequest);
}
