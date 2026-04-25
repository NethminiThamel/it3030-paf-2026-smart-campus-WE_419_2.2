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
public class FacilityImageStorageService {

	private final Path root;

	public FacilityImageStorageService(
			@Value("${app.upload.facility-image-dir:uploads/facility-images}") String dir) {
		this.root = Paths.get(dir).toAbsolutePath().normalize();
		try {
			Files.createDirectories(this.root);
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}

	public StoredFacilityImage store(MultipartFile file) throws IOException {
		String ext = "";
		String original = file.getOriginalFilename();
		if (original != null && original.contains(".")) {
			ext = original.substring(original.lastIndexOf('.'));
		}
		String name = UUID.randomUUID() + ext;
		Path target = root.resolve(name);
		Files.copy(file.getInputStream(), target);
		return new StoredFacilityImage(name, original != null ? original : "file", file.getContentType());
	}

	public void delete(String storedFilename) {
		try {
			Files.deleteIfExists(root.resolve(storedFilename));
		} catch (IOException e) {
			// Log and continue, not a critical failure for the user
			System.err.println("Could not delete file: " + storedFilename);
		}
	}

	public record StoredFacilityImage(String storedFilename, String originalFilename, String contentType) {}
}


