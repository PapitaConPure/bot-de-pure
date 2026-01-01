using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CommandBuilder {
	public class CommandBuilder {
		private readonly List<CommandComponent> components;
		private ComponentType tipos;

		public enum ComponentType {
			None = 0,
			CommandManager = 1,
			CommandTagsManager = 2,
			CommandOptions = 4,
			AllRequired = CommandManager | CommandTagsManager,
			All = AllRequired | CommandOptions,
		}

		public CommandBuilder(List<CommandComponent> components) {
			this.components = components;
			this.LimpiarComponentes();
		}

		public CommandBuilder(params CommandComponent[] components): this(components.ToList()) {}

		public CommandBuilder(): this(new List<CommandComponent>()) {}

		public CommandBuilder AgregarComponente(CommandComponent component) {
			this.components.Add(component);
			this.tipos |= component.Tipo;
			return this;
		}

		public void LimpiarComponentes() {
			this.tipos = ComponentType.None;
			this.components.Clear();
		}

		public string ImprimirTodo() {
			if(!this.tipos.HasFlag(ComponentType.CommandManager))
				throw new NullReferenceException("Se debe definir un CommandManager para construir un archivo de comando");
			if(!this.tipos.HasFlag(ComponentType.CommandTagsManager))
				throw new NullReferenceException("Se debe definir un CommandTags para construir un archivo de comando");

			this.components.Sort();

			StringBuilder total = new StringBuilder();
			total.AppendLine("const {  } = require('discord.js'); //Integrar discord.js");
			total.AppendLine("const {  } = require('../../func'); //Funciones de utilidad");
			total.AppendLine("const {  } = require('../../data/config.json'); //Configuraciones");
			total.AppendLine("const { CommandTags, CommandManager } = require('../Commons/commands');");
			total.AppendLine("const { Translator } = require('../../i18n/internationalization'); //Internacionalización");
			total.AppendLine("const { p_pure } = require('../../utils/prefixes');");
			
			total.AppendLine($"const {{ {string.Join(", ", this.components.Select(c => c.Requiere))} }} = require('../Commons/commands');");

			if(this.tipos.HasFlag(ComponentType.CommandOptions)) {
				CommandManager manager = this.components.Find(c => c.Tipo == ComponentType.CommandManager) as CommandManager;
				manager.UsaOpciones = true;
			}

			total.AppendLine();
			bool pasóPrimero = false;
			foreach(CommandComponent component in this.components) {
				if(pasóPrimero)
					total.AppendLine();
				else
					pasóPrimero = true;

				total.AppendLine(component.Imprimir());
			}

			total.AppendLine();
			total.AppendLine("module.exports = command;");

			return total.ToString();
		}
	}
}