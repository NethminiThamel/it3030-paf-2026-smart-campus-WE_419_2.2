package backend.service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

	private final Path root;

	public FileStorageService(
			@Value("${app.upload.ticket-attachment-dir:uploads/ticket-attachments}") String dir) {
		this.root = Paths.get(dir).toAbsolutePath().normalize();
		try {
			Files.createDirectories(this.root);
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}

	public String store(MultipartFile file) throws IOException {
		String ext = "";
		String original = file.getOriginalFilename();
		if (original != null && original.contains(".")) {
			ext = original.substring(original.lastIndexOf('.'));
		}
		String name = UUID.randomUUID() + ext;
		Path target = root.resolve(name);
		Files.copy(file.getInputStream(), target);
		return name;
	}
}
