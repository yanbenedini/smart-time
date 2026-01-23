import { AppDataSource } from "../src/data-source";
import { SystemUser } from "../src/entity/SystemUser";
import bcrypt from "bcryptjs";

const resetAdmin = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Data Source initialized");

        const userRepo = AppDataSource.getRepository(SystemUser);
        const email = "adm.smarttime@ccmtecnologia.com.br";
        const password = "123"; // Senha simples para teste

        let user = await userRepo.findOneBy({ email });

        if (!user) {
            console.log("Usuário não encontrado. Criando novo admin...");
            user = new SystemUser();
            user.email = email;
            user.name = "Administrador";
            user.isAdmin = true;
            user.mustChangePassword = true;
        } else {
            console.log("Usuário encontrado. Resetando senha...");
        }

        user.password = await bcrypt.hash(password, 10);
        await userRepo.save(user);

        console.log("Admin resetado com sucesso!");
        console.log(`Email: ${email}`);
        console.log(`Senha: ${password}`);

        process.exit(0);
    } catch (error) {
        console.error("Erro ao resetar admin:", error);
        process.exit(1);
    }
};

resetAdmin();
