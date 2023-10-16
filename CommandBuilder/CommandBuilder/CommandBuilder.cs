using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CommandBuilder {
	public class CommandBuilder {
		private CommandManager commandManager;
		private CommandTagsManager commandTagsManager;
		private CommandOptionsManager commandOptionsManager;

		public CommandBuilder() {
			this.LimpiarImprimibles();
		}

		public CommandBuilder AgregarImprimible(CommandManager commandManager) {
			this.commandManager = commandManager;
			return this;
		}

		public CommandBuilder AgregarImprimible(CommandTagsManager commandTagsManager) {
			this.commandTagsManager = commandTagsManager;
			return this;
		}

		public CommandBuilder AgregarImprimible(CommandOptionsManager commandOptionsManager) {
			this.commandOptionsManager = commandOptionsManager;
			return this;
		}

		public void LimpiarImprimibles() {
			this.commandManager = null;
			this.commandTagsManager = null;
			this.commandOptionsManager = null;
		}

		public string ImprimirTodo() {
			if(this.commandManager == null)
				throw new NullReferenceException("Se debe definir un CommandManager para construir un archivo de comando");
			if(this.commandTagsManager == null)
				throw new NullReferenceException("Se debe definir un CommandMetaFlagsManager para construir un archivo de comando");

			string total =
				"//const {  } = require('discord.js'); //Integrar discord.js\n" +
				"//const {  } = require('../../func.js'); //Funciones globales\n" +
				"//const { p_pure } = require('../../localdata/customization/prefixes.js');\n" +
				"//const { p_pure } = require('../../localdata/customization/prefixes.js');\n" +
				"const { CommandManager, CommandMetaFlagsManager";

			if(this.commandOptionsManager != null)
				total += ", CommandOptionsManager }";
			else
				total += " }";

			total += " = require('../Commons/commands.js');\n\n";

			if(this.commandOptionsManager != null)
				total += this.commandOptionsManager.Imprimir() + "\n";

			total += this.commandTagsManager.Imprimir() + "\n";
			total += this.commandManager.Imprimir();

			return total;
		}
	}
}
