package com.mwang.backend.domain.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DocumentNode {
    private String type;
    private String text;
    @Builder.Default
    private List<InlineFormat> formats = new ArrayList<>();
    private List<DocumentNode> children;
    @Builder.Default
    private Map<String, Object> attributes = new HashMap<>();

    public boolean isLeaf() {
        return children == null || children.isEmpty();
    }
}
