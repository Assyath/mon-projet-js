import "dotenv/config";
import OpenAI from "openai";
import fs from "fs";
import readline from "readline";

const client = new OpenAI({
    apiKey: process.env.RODIUMAI_API_KEY,
    baseURL: "https://api.rodiumai.io/v1",
});

if (!process.env.RODIUMAI_API_KEY) {
    console.log("Erreur : Cle API manquante dans le fichier .env.");
    process.exit(1);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const questionAsync = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    let etape = 1;
    console.log("=== SCRIPT INTERACTIF RODIUMAI (VERSION SDK JS) ===");

    while (etape >= 1 && etape <= 3) {

        // ETAPE 1 : CHAT

        if (etape === 1) {
            console.log("\n=== Etape 1 : Chat ===");
            const votreQuestion = await questionAsync("Votre question : ");
            
            console.log("Envoi de la question via le SDK JS...");
            try {
                const rep = await client.chat.completions.create({
                    model: "openai/gpt-4o-mini",
                    messages: [{ role: "user", content: votreQuestion }],
                    temperature: 0.7
                });

                const texteReponse = rep.choices[0].message.content;
                const coutRodi = rep.cost_rodi || "Non specifie";

                console.log(`\n[reponse du modele]\n${texteReponse}`);
                console.log(`Cout : ${coutRodi} RODI`);
            } catch (error) {
                console.log("Erreur lors du chat :", error.message);
            }

            console.log("");
            const choix = (await questionAsync("Rester (r) ou passer a la suivante (s) ? ")).toLowerCase();
            if (choix === "s") etape = 2;
        }

        // ETAPE 2 : IMAGE

        else if (etape === 2) {
            console.log("\n=== Etape 2 : Image ===");
            const descriptionImage = await questionAsync("Decrivez l'image : ");

            console.log("Generation de l'image via le SDK JS...");
            try {
                const repImage = await client.images.generate({
                    model: "google/gemini-3.1-flash-lite-image",
                    prompt: descriptionImage,
                    n: 1,
                    size: "1024x1536",
                    response_format: "b64_json"
                });

                const base64Data = repImage.data[0].b64_json;
                fs.writeFileSync("image.png", Buffer.from(base64Data, "base64"));
                console.log("Image enregistree avec succes : image.png");
            } catch (error) {
                console.log("Erreur d'image :", error.message);
            }

            console.log("");
            const choix = (await questionAsync("Revenir (b), rester (r) ou passer a la suivante (s) ? ")).toLowerCase();
            if (choix === "b") etape = 1;
            else if (choix === "s") etape = 3;
        }

        // ETAPE 3 : VIDEO

        else if (etape === 3) {
            console.log("\n=== Etape 3 : Video ===");
            const descriptionVideo = await questionAsync("Decrivez la video : ");

            console.log("Generation de la video via le SDK JS...");
            try {
                // Utilisation de la duree de 4 secondes suite a ta decouverte !
                const repVideo = await client.post("/videos/generations", {
                    body: {
                        model: "google/veo-3.1-lite",
                        prompt: descriptionVideo,
                        duration_seconds: 4,
                        aspect_ratio: "9:16"
                    }
                });

                const base64Video = repVideo.data[0].b64_json;
                fs.writeFileSync("video.mp4", Buffer.from(base64Video, "base64"));
                console.log("Video enregistree avec succes : video.mp4");
            } catch (error) {
                console.log("Erreur de la video brute :", error.message);
            }

            console.log("");
            const choix = (await questionAsync("Revenir (b), rester (r) ou quitter (q) ? ")).toLowerCase();
            if (choix === "b") etape = 2;
            else if (choix === "q") {
                console.log("\nFin du programme. Au revoir !");
                break;
            }
        }
    }
    rl.close();
}

main();
