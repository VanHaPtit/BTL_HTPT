package com.mwang.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadImage(MultipartFile file) throws IOException {
        String originalName = file.getOriginalFilename();
        String fileNameOnly = "file_" + System.currentTimeMillis();

        if (originalName != null && originalName.contains(".")) {
            fileNameOnly = originalName.substring(0, originalName.lastIndexOf("."));
            fileNameOnly = fileNameOnly.replace(" ", "_").replaceAll("[^a-zA-Z0-9_-]", "");
        }

        Map upload = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "resource_type", "auto",
                        "folder", "htpt_assets",
                        "public_id", fileNameOnly,
                        "overwrite", true
                )
        );

        return upload.get("secure_url").toString();
    }
}
